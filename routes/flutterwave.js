// routes/flutterwave.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");

const FLW_BASE_URL = "https://api.flutterwave.com/v3";

// ✅ Initialize payment
router.post("/pay", async (req, res) => {
  const { amount, currency, publicUserId, platform } = req.body;

  if (!amount || !publicUserId || !platform) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  try {
    // 🔎 Find user
    const user = await User.findOne({ publicUserId });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // ✅ Embed user + platform in tx_ref for webhook tracking
    const txRef = `lumora-${publicUserId}-${platform}-${Date.now()}`;

    const response = await axios.post(
      `${FLW_BASE_URL}/payments`,
      {
        tx_ref: txRef,
        amount,
        currency: currency || "NGN",
        redirect_url: `${process.env.FLW_REDIRECT_URL}?userid=${publicUserId}&platform=${platform}`,
        customer: {
          email: user.email,
          name: publicUserId,
        },
        customizations: {
          title: "Lumora Billing",
          description: "Top-up payment",
          logo: "http://lumoraid.vaultlite.name.ng/lumora.png",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ Flutterwave init error:", err.response?.data || err.message);
    res.status(500).json({ msg: "Payment initialization failed" });
  }
});

// ✅ Webhook (Flutterwave calls this after payment)
router.post("/webhook", async (req, res) => {
  const secretHash = process.env.FLW_SECRET_HASH;
  const signature = req.headers["verif-hash"];

  if (!signature || signature !== secretHash) {
    return res.status(401).json({ msg: "Invalid signature" });
  }

  const payload = req.body;
  console.log("🔔 Flutterwave webhook received:", payload);

  if (payload.status === "successful") {
    try {
      // Extract user + platform from tx_ref
      const txParts = payload.tx_ref.split("-");
      const publicUserId = txParts[1];
      const platform = txParts[2];

      const user = await User.findOne({ publicUserId });
      if (user) {
        user.coins += Number(payload.amount);
        await user.save();

        // 📧 Send success email
        await sendEmail({
          to: user.email,
          subject: "💰 Payment Successful – Lumora Billing",
          html: `
            <h2>Hello ${user.username},</h2>
            <p>Your payment of <b>${payload.currency} ${payload.amount}</b> was successful.</p>
            <p>Your wallet has been updated. 🎉</p>
            <br>
            <p>Thanks for using Lumora Billing.</p>
          `,
        });
      }
    } catch (err) {
      console.error("⚠️ Failed to update user after payment:", err.message);
    }
  }

  res.sendStatus(200);
});

module.exports = router;
