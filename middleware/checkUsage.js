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

// ❌ Block any API user no own (unless it's a free API)
const [category, name] = endpoint.split('/');
const userOwns = user.ownedApis.find(a => a.name === name && a.category === category);
const isFreeApi = freeApis.includes(`${category}/${name}`);

if (!userOwns && !isFreeApi) {
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

// ✅ Storage logic based on number of owned APIs (5MB each)
usage.storage = user.ownedApis.length * 5;

  await usage.save();
  next();
};
