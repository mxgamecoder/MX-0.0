const fs = require('fs');
const path = require('path');
const Usage = require('../models/Usage');
const User = require('../models/User');
const plans = require('../routes/plan');
const freeApis = require('../data/freeapi');

module.exports = async function checkUsage(req, res, next) {
  const apiKey = req.query.meka;
  if (!apiKey) {
    return res.status(400).json({ success: false, message: "API key missing" });
  }

  const user = await User.findOne({ apiKey });
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid API key" });
  }

  // 🌍 Get endpoint from request (like "fun/joke")
  const endpoint = req.originalUrl.split('?')[0].replace(/^\/+/, '');

  let usage = await Usage.findOne({ userId: user._id });
  if (!usage) {
    usage = new Usage({ userId: user._id });
  }

  // ❌ Reject if user tries premium API without permission
  if (user.plan === 'free' && !freeApis.includes(endpoint)) {
    return res.status(403).json({
      success: false,
      message: "🚫 This API requires an upgrade to access."
    });
  }

  // ✅ Track usage count
  const plan = plans[user.plan?.toLowerCase()] || plans.free;
  if (usage.count >= plan.limit) {
    return res.status(429).json({ success: false, message: "Monthly request limit reached." });
  }

  usage.count += 5; // 👈 still count request usage

  // ✅ Storage logic (5MB per file in /data)
  try {
    const dataFolder = path.join(__dirname, '..', 'data');
    const files = fs.readdirSync(dataFolder).filter(file => fs.statSync(path.join(dataFolder, file)).isFile());

    usage.storage = files.length * 5;
  } catch (err) {
    console.error("❌ Failed to read data folder:", err);
    return res.status(500).json({ success: false, message: "Could not calculate storage" });
  }

  await usage.save();
  next();
};
