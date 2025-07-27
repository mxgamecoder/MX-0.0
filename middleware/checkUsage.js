const Usage = require('../models/Usage');
const User = require('../models/User');

module.exports = async function checkUsage(req, res, next) {
  const apiKey = req.query.meka;
  if (!apiKey) return res.status(400).json({ success: false, message: "API key missing" });

  const user = await User.findOne({ apiKey });
  if (!user) return res.status(401).json({ success: false, message: "Invalid API key" });

  let usage = await Usage.findOne({ userId: user._id });

  // Create usage doc if missing
  if (!usage) {
    usage = new Usage({ userId: user._id });
  }

  // Optional: check limits
  const plan = require('../routes/plan')[user.plan.toLowerCase()] || require('../routes/plan').free;
  if (usage.count >= plan.limit) {
    return res.status(429).json({ success: false, message: "Monthly request limit reached." });
  }

  usage.count += 1; // Increment usage
  await usage.save();

  next();
};
