const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Register (for development / initial seeding). Admins typically will create users instead.
router.post('/register', async (req, res) => {
  try {
    let { username, password, role, childName, childId, assignedCaretaker, assignedArea } = req.body;
    if (typeof username === 'string') username = username.trim().toLowerCase();
    if (!username || !password || !role) return res.status(400).json({ message: 'username, password, role required' });

    let existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      passwordHash: hash,
      role,
      child: role === 'parent' ? { id: childId || '', name: childName || '' } : undefined,
      assignedCaretaker: assignedCaretaker || undefined,
      assignedArea: assignedArea || undefined
    });

    await user.save();
    return res.json({ message: 'Registered' });
  } catch (err) {
    console.error('Register error:', err);
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', details: err.errors });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { username, password } = req.body;
    if (typeof username === 'string') username = username.trim().toLowerCase();
    if(!username || !password) return res.status(400).json({ message: 'username & password required' });
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    const tokenPayload = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      child: user.child,
      assignedCaretaker: user.assignedCaretaker ? user.assignedCaretaker.toString() : undefined
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

    return res.json({ token, user: tokenPayload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
