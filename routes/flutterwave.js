const express = require("express");
const router = express.Router();
const axios = require("axios");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const { paymentSuccessEmail } = require("../utils/templates");

// Flutterwave base
const FLW_VERIFY_URL = "https://api.flutterwave.com/v3/transactions/verify";

// Conversion rates (example)
const currencyRates = { NGN: 100, USD: 0.25, EUR: 0.23 };

// ===== Verify payment =====
router.post("/verify", async (req, res) => {
  const { tx_ref } = req.body;
  if (!tx_ref) return res.status(400).json({ msg: "Missing tx_ref" });

  try {
    // Call Flutterwave verify endpoint
    const verifyRes = await axios.get(`${FLW_VERIFY_URL}/${tx_ref}`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` }
    });

    const payload = verifyRes.data?.data;

    if (!payload) {
      console.error("❌ Flutterwave response missing data:", verifyRes.data);
      return res.status(400).json({ msg: "Invalid transaction reference" });
    }

    // Check if payment was successful
    if (payload.status === "successful") {
      const [prefix, publicUserId, platform, timestamp] = tx_ref.split("-");

      const user = await User.findOne({ publicUserId });
      if (!user) return res.status(404).json({ msg: "User not found" });

      const rate = currencyRates[payload.currency] || currencyRates["NGN"];
      const coinsPurchased = Math.round((payload.amount / rate) * 10);
      user.coins += coinsPurchased;
      await user.save();

      // Send success email (non-blocking)
      sendEmail({
        to: user.email,
        subject: "💰 Payment Successful – Lumora Billing",
        html: paymentSuccessEmail(
          user.username || publicUserId,
          platform,
          payload.amount,
          payload.currency,
          coinsPurchased
        ),
      }).catch(err => console.error("❌ Email sending failed:", err.message));

      return res.json({ status: "success", coinsPurchased });
    }

    // Pending / failed payment
    return res.json({
      status: payload.status || "failed",
      msg: `Payment status: ${payload.status || "failed"}`
    });

  } catch (err) {
    console.error("❌ Payment verification error:", err.response?.data || err.message);
    return res.status(500).json({ msg: "Payment verification failed" });
  }
});

module.exports = router;
