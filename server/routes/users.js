const express = require('express');
const User = require('../models/User');
const Cart = require('../models/Cart');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me - 获取当前用户信息
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/users/me - 更新当前用户信息
router.put('/me', protect, async (req, res) => {
  try {
    const { recipient, phone, address, email } = req.body;

    const user = await User.findById(req.user._id);

    if (recipient !== undefined) user.recipient = recipient;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (email !== undefined && user.role === 'admin') user.email = email;

    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      points: user.points,
      recipient: user.recipient,
      phone: user.phone,
      address: user.address,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users - 获取所有普通用户（管理员）
router.get('/', protect, admin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users - 创建普通用户（管理员）
router.post('/', protect, admin, async (req, res) => {
  try {
    const { username, password, points } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '请输入用户名和密码' });
    }

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const user = await User.create({
      username,
      password,
      role: 'user',
      points: points || 0,
      isFirstLogin: true
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      points: user.points,
      isFirstLogin: user.isFirstLogin
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/users/:id - 更新普通用户（管理员）
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: '不能修改管理员' });
    }

    const { username, password, points } = req.body;

    if (username && username !== user.username) {
      const userExists = await User.findOne({ username });
      if (userExists) {
        return res.status(400).json({ message: '用户名已存在' });
      }
      user.username = username;
    }

    if (password) {
      user.password = password;
      user.isFirstLogin = true;
    }

    if (points !== undefined) {
      user.points = points;
    }

    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      points: user.points
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/users/:id - 删除普通用户（管理员）
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: '不能删除管理员' });
    }

    await Cart.deleteOne({ userId: user._id });
    await User.deleteOne({ _id: user._id });

    res.json({ message: '用户已删除' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
