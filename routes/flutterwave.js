const express = require("express");
const router = express.Router();
const axios = require("axios");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");

const FLW_BASE_URL = "https://api.flutterwave.com/v3";

// Currency → Coins mapping (10 coins = X currency)
const currencyRates = { NGN: 100, USD: 0.25, EUR: 0.23 };

// ✅ Initialize payment
router.post("/pay", async (req, res) => {
  const { amount, currency, publicUserId, platform } = req.body;
  if (!amount || !publicUserId || !platform) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  try {
    const user = await User.findOne({ publicUserId });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Embed user + platform in tx_ref
    const txRef = `lumora-${publicUserId}-${platform}-${Date.now()}`;

    const response = await axios.post(
      `${FLW_BASE_URL}/payments`,
      {
        tx_ref: txRef,
        amount,
        currency: currency || "NGN",
        redirect_url: `${process.env.FLW_REDIRECT_URL}?userid=${publicUserId}&platform=${platform}&price=${amount}&currency=${currency || 'NGN'}`,
        customer: { email: user.email, name: user.username || publicUserId },
        customizations: {
          title: "Lumora Billing",
          description: "Top-up payment",
          logo: "http://lumoraid.vaultlite.name.ng/lumora.png",
        },
      },
      { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ Flutterwave init error:", err.response?.data || err.message);
    res.status(500).json({ msg: "Payment initialization failed" });
  }
});

// ✅ Webhook
router.post("/webhook", async (req, res) => {
  const secretHash = process.env.FLW_SECRET_HASH;
  const signature = req.headers["verif-hash"];
  if (!signature || signature !== secretHash) return res.status(401).json({ msg: "Invalid signature" });

  const payload = req.body;
  console.log("🔔 Flutterwave webhook received:", payload);

  if (payload.status === "successful") {
    try {
      const txParts = payload.tx_ref.split("-");
      const publicUserId = txParts[1];
      const platform = txParts[2];

      const user = await User.findOne({ publicUserId });
      if (!user) return res.sendStatus(200);

      // Convert currency → coins
      const rate = currencyRates[payload.currency] || currencyRates["NGN"];
      const coinsPurchased = Math.round(payload.amount / rate * 10);
      user.coins += coinsPurchased;
      await user.save();

      // Send success email
      try {
        await sendEmail({
          to: user.email,
          subject: "💰 Payment Successful – Lumora Billing",
          html: `
            <h2>Hello ${user.username || publicUserId},</h2>
            <p>Your payment of <b>${payload.currency} ${payload.amount}</b> was successful.</p>
            <p>You received <b>${coinsPurchased} coins</b> in your wallet. 🎉</p>
            <p>Platform: <b>${platform}</b></p>
            <br>
            <p>Thanks for using Lumora Billing.</p>
          `,
        });
      } catch (err) {
        console.error("❌ Failed to send email:", err.message);
      }
    } catch (err) {
      console.error("⚠️ Failed to update user after payment:", err.message);
    }
  }

  res.sendStatus(200);
});

module.exports = router;
