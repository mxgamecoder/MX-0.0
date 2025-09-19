const express = require("express");
const router = express.Router();
const axios = require("axios");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const Payment = require("../models/Payment"); // new Payment model
const { paymentSuccessEmail } = require("../utils/templates");

const FLW_BASE_URL = "https://api.flutterwave.com/v3";

// Bonus logic
function getBonus(coins) {
  if (coins < 100) return 10;
  if (coins < 1000) return 100;
  if (coins < 100000) return 1000;
  return 10000;
}

// Currency rates
const currencyRates = { NGN: 100, USD: 0.25, EUR: 0.23 };

/**
 * Initialize Payment
 */
router.post("/pay", async (req, res) => {
  const { amount, currency, publicUserId, platform } = req.body;
  if (!amount || !publicUserId || !platform) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  if (!process.env.FLW_SECRET_KEY || !process.env.FLW_REDIRECT_URL) {
    return res.status(500).json({ msg: "Server not configured properly" });
  }

  try {
    const user = await User.findOne({ publicUserId });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 🔹 Generate internal payment ID
    const paymentId = `pay-${publicUserId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 🔹 Generate Flutterwave tx_ref
    const txRef = `lumora-${paymentId}`;

    // 🔹 Save initial payment record
    const payment = new Payment({
      paymentId,
      publicUserId,
      platform,
      amount,
      currency: currency || "NGN",
      status: "pending",
      tx_ref: txRef
    });
    await payment.save();

    // 🔹 Initialize Flutterwave payment
    const response = await axios.post(
      `${FLW_BASE_URL}/payments`,
      {
        tx_ref: txRef,
        amount,
        currency: currency || "NGN",
        redirect_url: `${process.env.FLW_REDIRECT_URL}?paymentId=${paymentId}`,
        customer: { email: user.email, name: user.username || publicUserId },
        customizations: {
          title: "Lumora Billing",
          description: "Top-up payment",
          logo: "http://lumoraid.vaultlite.name.ng/lumora.png"
        }
      },
      { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
    );

    // Send back payment link + internal ID
    res.json({ 
      status: "success", 
      link: response.data.data.link, 
      paymentId 
    });

  } catch (err) {
    console.error("❌ Flutterwave init error:", err.response?.data || err.message);
    res.status(500).json({ msg: "Payment initialization failed" });
  }
});

/**
 * Verify Payment (handles both API & manual payments)
 */
router.post("/verify", async (req, res) => {
  const { paymentId, manual, amount, currency, publicUserId, platform } = req.body;

  if (!paymentId && !manual) return res.status(400).json({ msg: "Missing paymentId" });
  if (!process.env.FLW_SECRET_KEY) return res.status(500).json({ msg: "Server not configured properly" });

  try {
    const user = await User.findOne({ publicUserId });
    if (!user) return res.status(404).json({ msg: "User not found" });

    let coinsPurchased;
    let payment = null;

    // ===== Manual settlement =====
    if (manual) {
      if (!amount || !currency || !platform) return res.status(400).json({ msg: "Missing manual payment data" });

      coinsPurchased = Math.round((amount / (currencyRates[currency] || 100)) * 10);
      coinsPurchased += getBonus(coinsPurchased);

      user.coins += coinsPurchased;
      await user.save();

      // Save manual payment
      payment = new Payment({
        paymentId: `manual-${Date.now()}`,
        publicUserId,
        amount,
        coins: coinsPurchased,
        currency,
        platform,
        status: "successful"
      });
      await payment.save();

      // Send email
      sendEmail({
        to: user.email,
        subject: "💰 Payment Successful – Lumora Billing",
        html: paymentSuccessEmail(user.username || publicUserId, platform, amount, currency, coinsPurchased)
      }).catch(console.error);

      return res.json({ msg: "Manual payment credited successfully", coinsPurchased, paymentId: payment.paymentId });
    }

    // ===== API payment verification =====
    payment = await Payment.findOne({ paymentId });
    if (!payment) return res.status(404).json({ msg: "Payment record not found" });

    const verifyRes = await axios.get(`${FLW_BASE_URL}/transactions/verify/${payment.tx_ref}`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      validateStatus: false
    });

    if (!verifyRes.data?.data) {
      console.warn("❌ Flutterwave verification invalid:", verifyRes.data);
      return res.status(400).json({ msg: "Payment not found via API" });
    }

    const payload = verifyRes.data.data;
    if (payload.status !== "successful") return res.status(400).json({ msg: `Payment not successful. Status: ${payload.status}` });

    coinsPurchased = Math.round((payload.amount / (currencyRates[payload.currency] || 100)) * 10);
    coinsPurchased += getBonus(coinsPurchased);

    user.coins += coinsPurchased;
    await user.save();

    // Update payment record
    payment.status = "successful";
    payment.coins = coinsPurchased;
    await payment.save();

    // Send email
    sendEmail({
      to: user.email,
      subject: "💰 Payment Successful – Lumora Billing",
      html: paymentSuccessEmail(user.username || publicUserId, platform, payload.amount, payload.currency, coinsPurchased)
    }).catch(console.error);

    res.json({ msg: "Payment verified successfully", coinsPurchased, paymentId: payment.paymentId });

  } catch (err) {
    console.error("❌ Payment verification error:", err.response?.data || err.message);
    res.status(500).json({ msg: "Payment verification failed" });
  }
});

module.exports = router;
