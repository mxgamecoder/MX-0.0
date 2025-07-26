// routes/user.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const meka = require('../middleware/auth');
const User = require('../models/User');

router.post('/create-api-key', meka, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (user.apiKey) return res.status(400).json({ msg: 'API key already exists' });

    const newKey = `meka_${crypto.randomBytes(12).toString('hex')}`;
    user.apiKey = newKey;
    await user.save();

    res.json({ msg: 'API key created successfully', apiKey: newKey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Fetch existing API key
router.get('/get-api-key', meka, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (!user.apiKey) return res.status(404).json({ msg: 'API key not created yet' });

    res.json({ apiKey: user.apiKey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
