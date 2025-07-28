const fs = require('fs');
const path = require('path');
const Usage = require('../models/Usage');
const User = require('../models/User');
const plans = require('../routes/plan');
const freeApis = require('../data/freeApis');

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

// ❌ Block any API user no own// Extract endpoint parts like: catch/chatgpt → category = 'catch', name = 'chatgpt'
const [category, name] = endpoint.split('/');

// Check if this user owns the API
const userOwns = user.ownedApis.find(a => a.name === name && a.category === category);

if (!userOwns) {
  return res.status(403).json({
    success: false,
    message: "🚫 You do not own this API. Go to dashboard to rent/buy it."
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
