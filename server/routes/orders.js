const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Product = require('../models/Product');
const { sendOrderNotification } = require('../config/email');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// GET /api/orders/all - 获取所有订单（管理员）
router.get('/all', protect, admin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'username')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/orders/:id/status - 更新订单状态（管理员）
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'shipped', 'completed'].includes(status)) {
      return res.status(400).json({ message: '无效的订单状态' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders - 获取用户订单
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/orders - 创建订单
router.post('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // 检查收件信息
    if (!user.recipient || !user.phone || !user.address) {
      return res.status(400).json({ message: '请先完善收件信息' });
    }

    // 获取购物车
    const cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: '购物车为空' });
    }

    // 过滤有效商品并计算总积分
    const validItems = cart.items.filter(item => item.productId);

    if (validItems.length === 0) {
      return res.status(400).json({ message: '购物车中没有有效商品' });
    }

    const orderItems = validItems.map(item => ({
      productId: item.productId._id,
      name: item.productId.name,
      points: item.productId.points,
      quantity: item.quantity
    }));

    const totalPoints = orderItems.reduce(
      (sum, item) => sum + item.points * item.quantity,
      0
    );

    // 检查积分是否足够
    if (user.points < totalPoints) {
      return res.status(400).json({
        message: `积分不足，需要 ${totalPoints} 积分，当前积分 ${user.points}`
      });
    }

    // 检查库存是否足够
    for (const item of validItems) {
      if (item.productId.stock < item.quantity) {
        return res.status(400).json({
          message: `商品 "${item.productId.name}" 库存不足，当前库存 ${item.productId.stock}`
        });
      }
    }

    // 创建订单
    const order = await Order.create({
      userId: user._id,
      items: orderItems,
      totalPoints,
      recipient: user.recipient,
      phone: user.phone,
      address: user.address,
      status: 'pending'
    });

    // 扣除积分
    user.points -= totalPoints;
    await user.save();

    // 扣减库存
    for (const item of validItems) {
      await Product.findByIdAndUpdate(item.productId._id, {
        $inc: { stock: -item.quantity }
      });
    }

    // 清空购物车
    cart.items = [];
    await cart.save();

    // 发送邮件通知管理员
    sendOrderNotification(order, user);

    res.status(201).json({
      order,
      remainingPoints: user.points
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
