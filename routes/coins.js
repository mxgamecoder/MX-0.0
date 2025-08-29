// mxapi/routes/coins.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth'); // JWT middleware
const User = require('../models/User');

// Define VaultX plans and coins required
const vaultxPlans = {
  free: 0,
  bronze: 500,
  silver: 1500,
  gold: 3000,
  platinum: 6000,
  elite: 12000
};

/**
 * POST /coins/check
 * Body: { publicUserId: string, plan: string }
 * Response: { canAfford: boolean, remainingCoins?: number, message: string }
 */
// POST /coins/upgrade
router.post('/upgrade', authenticate, async (req, res) => {
  const { publicUserId, plan } = req.body;

  if (!publicUserId || !plan) {
    return res.status(400).json({ message: "Missing publicUserId or plan" });
  }

  const normalizedPlan = plan.toLowerCase();
  if (!vaultxPlans.hasOwnProperty(normalizedPlan)) {
    return res.status(400).json({ message: "Invalid plan selected" });
  }

  try {
    const user = await User.findOne({ publicUserId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const requiredCoins = vaultxPlans[normalizedPlan];
    if (user.coins < requiredCoins) {
      return res.json({
        success: false,
        message: `❌ You need ${requiredCoins - user.coins} more coins to upgrade to ${plan}`
      });
    }

    // Deduct coins & update plan
    user.coins -= requiredCoins;
    user.vaultxPlan = normalizedPlan;
    await user.save();

    return res.json({
      success: true,
      message: `🎉 Successfully upgraded to ${plan} plan!`,
      coinsLeft: user.coins,
      vaultxPlan: user.vaultxPlan
    });
  } catch (err) {
    console.error("Error upgrading plan:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
