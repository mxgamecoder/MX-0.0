const Usage = require('../models/Usage');
const User = require('../models/User');
const freeApis = require('../data/freeApis');
const planData = require('../routes/plan');

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

  const plan = planData[user.plan.toLowerCase()] || planData.free;
  if (usage.count >= plan.limit) {
    return res.status(429).json({ success: false, message: "Monthly request limit reached." });
  }

  // 🧠 Storage increase by 5MB per owned API hit
  const reqPath = req.path.replace(/^\/+/, '');
  const matchedApi = freeApis.find(api => reqPath.endsWith(api));
  const additionalStorage = matchedApi ? 5 : 0;

  usage.count += 1;
  usage.storage += additionalStorage;

  await usage.save();
  next();
};
