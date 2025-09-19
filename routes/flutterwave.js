// routes/flutterwave.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");

const FLW_BASE_URL = "https://api.flutterwave.com/v3";

// ✅ Initialize payment
// routes/flutterwave.js
router.post("/pay", async (req, res) => {
  const { amount, currency, publicUserId } = req.body;

  if (!amount || !publicUserId) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  try {
    // 🔎 Find user in DB
    const user = await User.findOne({ publicUserId });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // ✅ Use user's stored email
    const response = await axios.post(
      `${FLW_BASE_URL}/payments`,
      {
        tx_ref: `lumora-${Date.now()}`,
        amount,
        currency: currency || "NGN",
        redirect_url: process.env.FLW_REDIRECT_URL, // billing-success.html
        customer: {
          email: user.email,
          phonenumber: "N/A",
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

// ✅ Webhook (Flutterwave will call this after payment)
router.post("/webhook", async (req, res) => {
  const secretHash = process.env.FLW_SECRET_HASH; // configure in .env & Flutterwave dashboard
  const signature = req.headers["verif-hash"];

  if (!signature || signature !== secretHash) {
    return res.status(401).json({ msg: "Invalid signature" });
  }

  const payload = req.body;
  console.log("🔔 Flutterwave webhook received:", payload);

  if (payload.status === "successful") {
    try {
      const user = await User.findOne({ publicUserId: payload.customer.name });
      if (user) {
        user.coins += Number(payload.amount); // example: add coins = amount paid
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
