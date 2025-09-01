// mxapi/routes/coins.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { sedEmail, planEmailTemplate } = require("../utils/VaultX");

router.post("/upgrade", async (req, res) => {
  try {
    const { publicUserId, plan } = req.body;  
    const user = await User.findOne({ publicUserId });

    if (!user) return res.status(404).json({ error: "User not found" });

 const plans = {
  free: { price: 0, days: 0 },
  bronze: { price: 50, days: 5 },
  silver: { price: 100, days: 30 },
  gold: { price: 200, days: 30 },
  platinum: { price: 400, days: 30 },
  elite: { price: 1000, days: 30 }
};

    const chosenPlan = plans[plan.toLowerCase()];
    if (!chosenPlan) return res.status(400).json({ error: "Invalid plan" });

    if (user.coins < chosenPlan.price) {
      return res.status(400).json({ error: "Not enough coins" });
    }

    user.coins -= chosenPlan.price;
    user.vaultxPlan = plan.toLowerCase();

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + chosenPlan.days);
    user.vaultxPlanExpire = expireDate;

    await user.save();

    // ✅ send confirmation email
    await sedEmail(
      user.email,
      `VaultX Plan Activated – ${plan.toUpperCase()} 🎉`,
      planEmailTemplate({
        username: user.username,
        plan,
        daysRemaining: chosenPlan.days,
        type: "purchase"
      })
    );

    res.json({ message: "Plan upgraded successfully", plan: user.vaultxPlan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
