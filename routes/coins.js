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

    // ✅ Updated plans with short + longer durations
    const plans = {
      free: { price: 0, days: 0 },

      starter3d: { price: 10, days: 3 },  // 3 days
      basic7d: { price: 20, days: 7 },    // 7 days

      bronze: { price: 50, days: 30 },    // 1 month
      silver: { price: 100, days: 60 },   // 2 months
      gold: { price: 200, days: 90 },     // 3 months
      platinum: { price: 400, days: 90 }, // 3 months
      elite: { price: 1000, days: 270 }   // 9 months
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

    res.json({
      success: true,
      message: `Plan upgraded to ${plan.toUpperCase()} successfully ✅`,
      vaultxPlan: user.vaultxPlan,
      coinsLeft: user.coins
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
