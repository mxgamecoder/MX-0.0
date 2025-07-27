// routes/user.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const meka = require('../middleware/auth');
const User = require('../models/User');
const plans = require('./plan');
const usageModel = require('../models/Usage');
const freeApis = require('../data/freeApis');

router.post('/assign-free-apis', meka, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (user.ownedApis && user.ownedApis.length >= 10) {
      return res.status(400).json({ msg: 'Free APIs already assigned' });
    }

    user.ownedApis = freeApis.slice(0, 10); // Give first 10
    await user.save();

    res.json({ msg: 'Free APIs assigned', ownedApis: user.ownedApis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

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

  // ✅ Create usage doc if it doesn't exist
  let usage = await usageModel.findOne({ userId: user._id });
  if (!usage) {
    usage = await usageModel.create({ userId: user._id });
  }

  const used = usage.count;
  const storageUsed = usage.storage;

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
