const express = require('express');
const router = express.Router();
const verify = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// All admin routes require token + admin role
router.use(verify);

router.get('/users', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const users = await User.find().select('-passwordHash').lean();
  return res.json(users);
});

// Admin creates a user (Admin UI will call this)
router.post('/create-user', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    let { username, password, role, childName, childId, assignedCaretaker, assignedArea } = req.body;
    if (typeof username === 'string') username = username.trim().toLowerCase();
    if (!username || !password || !role) return res.status(400).json({ message: 'username,password,role required' });

    let existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'User exists' });

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
    return res.json({ message: 'Created' });
  } catch (err) {
    console.error('Admin create-user error:', err);
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', details: err.errors });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});

// Assign a parent to a caretaker
router.post('/assign-parent', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const { parentId, caretakerId } = req.body;
  if (!parentId || !caretakerId) return res.status(400).json({ message: 'parentId & caretakerId required' });

  const parent = await User.findById(parentId);
  if (!parent || parent.role !== 'parent') return res.status(400).json({ message: 'Invalid parent' });

  parent.assignedCaretaker = caretakerId;
  await parent.save();
  return res.json({ message: 'Assigned' });
});

module.exports = router;
