const User = require("../models/User");
const plans = require("../routes/plan");

module.exports = async function checkUsage(req, res, next) {
  try {
    const apiKey = req.query.meka;

    if (!apiKey) {
      return res.status(401).json({ error: "Missing API key ❌" });
    }

    const user = await User.findOne({ apiKey });
    if (!user) {
      return res.status(404).json({ error: "Invalid API key 🕵️" });
    }

    const currentPlan = plans[user.plan.toLowerCase()];
    if (!currentPlan) {
      return res.status(400).json({ error: "Invalid subscription plan 💳" });
    }

    const now = new Date();
    const resetDate = user.monthlyReset || now;

    // 💡 Auto-reset request count monthly
    const oneMonthLater = new Date(resetDate);
    oneMonthLater.setMonth(resetDate.getMonth() + 1);

    if (now >= oneMonthLater) {
      user.requestCount = 0;
      user.monthlyReset = now;
    }

    // ❌ Abort if request limit exceeded
    if (user.requestCount >= currentPlan.limit) {
      return res.status(429).json({
        error: `Monthly request limit (${currentPlan.limit}) exceeded for your ${currentPlan.name} 🚫. Upgrade your plan.`
      });
    }

    // ✅ Continue and count request
    user.requestCount += 1;
    await user.save();

    // Attach user if needed
    req.user = user;
    next();

  } catch (err) {
    console.error("checkUsage error:", err);
    res.status(500).json({ error: "Server error in usage check" });
  }
};
