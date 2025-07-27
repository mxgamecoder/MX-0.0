const Usage = require('../models/Usage');
const User = require('../models/User');
const plans = require('../routes/plan');

module.exports = async function checkUsage(req, res, next) {
  const apiKey = req.query.meka;
  if (!apiKey) {
    return res.status(400).json({ success: false, message: "API key missing" });
  }

  const user = await User.findOne({ apiKey });
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid API key" });
  }

  let usage = await Usage.findOne({ userId: user._id });
  if (!usage) {
    usage = new Usage({ userId: user._id });
  }

  const plan = plans[user.plan?.toLowerCase()] || plans.free;
  if (usage.count >= plan.limit) {
    return res.status(429).json({ success: false, message: "Monthly request limit reached." });
  }

  // 🧠 Separate system:
  usage.count += 1;           // 📊 Track request
  usage.storage += 5;         // 💾 Add 5MB per request

  await usage.save();
  next();
};
