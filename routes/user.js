// routes/user.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const meka = require('../middleware/auth');
const User = require('../models/User');
const plans = require('./plan');
const usageModel = require('../models/Usage');
router.get('/usage', async (req, res) => {
  const apiKey = req.query.meka;

  if (!apiKey) {
    return res.status(400).json({ success: false, message: "API key missing." });
  }

  const user = await User.findOne({ apiKey });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const plan = plans[user.plan.toLowerCase()] || plans.free;

  // Get usage stats
  const usage = await usageModel.findOne({ userId: user._id });
  const used = usage?.count || 0;
  const storageUsed = usage?.storage || 0;

  res.json({
    success: true,
    plan: plan.name,
    limit: plan.limit,
    used,
    storageLimit: plan.storage,
    storageUsed
  });
});

router.post('/create-api-key', meka, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (!user.apiKeyRegens) user.apiKeyRegens = 0;

    if (user.apiKeyRegens >= 3) {
      return res.status(403).json({ msg: 'API key regeneration limit reached' });
    }

    const newKey = `meka_${crypto.randomBytes(12).toString('hex')}`;
    user.apiKey = newKey;
    user.apiKeyRegens += 1;

    await user.save();

    res.json({ msg: 'API key regenerated', apiKey: newKey, remaining: 3 - user.apiKeyRegens });
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
