const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/cart - 获取购物车
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId');

    if (!cart) {
      cart = { userId: req.user._id, items: [] };
    }

    // 过滤掉已删除的商品
    const validItems = cart.items.filter(item => item.productId);

    res.json({
      items: validItems.map(item => ({
        productId: item.productId._id,
        name: item.productId.name,
        image: item.productId.image,
        points: item.productId.points,
        stock: item.productId.stock,
        quantity: item.quantity
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/cart - 添加商品到购物车
router.post('/', protect, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = new Cart({
        userId: req.user._id,
        items: []
      });
    }

    const existingItem = cart.items.find(
      item => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();

    res.json({ message: '已添加到购物车' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/cart - 更新购物车商品数量
router.put('/', protect, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: '数量必须大于0' });
    }

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: '购物车为空' });
    }

    const item = cart.items.find(
      item => item.productId.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: '商品不在购物车中' });
    }

    item.quantity = quantity;
    await cart.save();

    res.json({ message: '数量已更新' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/cart/:productId - 从购物车删除商品
router.delete('/:productId', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: '购物车为空' });
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== req.params.productId
    );

    await cart.save();

    res.json({ message: '商品已从购物车移除' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
