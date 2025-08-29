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
router.post('/check', authenticate, async (req, res) => {
  const { publicUserId, plan } = req.body;

  if (!publicUserId || !plan) {
    return res.status(400).json({ message: "Missing publicUserId or plan" });
  }

  if (!vaultxPlans.hasOwnProperty(plan)) {
    return res.status(400).json({ message: "Invalid plan selected" });
  }

  try {
    const user = await User.findOne({ publicUserId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const requiredCoins = vaultxPlans[plan];
    const userCoins = user.coins || 0;

    if (userCoins >= requiredCoins) {
      return res.json({
        canAfford: true,
        message: `✅ You have enough coins (${userCoins}) for the ${plan} plan`
      });
    } else {
      const remaining = requiredCoins - userCoins;
      return res.json({
        canAfford: false,
        remainingCoins: remaining,
        message: `❌ You need ${remaining} more coins to purchase the ${plan} plan`
      });
    }
  } catch (err) {
    console.error("Error checking coins:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
