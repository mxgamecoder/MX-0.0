const express = require("express");
const router = express.Router();
const axios = require("axios");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
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
 * Expects: { amount, currency, publicUserId, platform }
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

    const txRef = `lumora-${publicUserId}-${platform}-${Date.now()}`;

    const response = await axios.post(
      `${FLW_BASE_URL}/payments`,
      {
        tx_ref: txRef,
        amount,
        currency: currency || "NGN",
        redirect_url: `${process.env.FLW_REDIRECT_URL}?tx_ref=${txRef}&userid=${publicUserId}&platform=${platform}&price=${amount}&currency=${currency || 'NGN'}`,
        customer: { email: user.email, name: user.username || publicUserId },
        customizations: { title: "Lumora Billing", description: "Top-up payment", logo: "http://lumoraid.vaultlite.name.ng/lumora.png" },
      },
      { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
    );

    // Send back the payment link for frontend redirection
    res.json({ status: "success", link: response.data.data.link, tx_ref: txRef });
  } catch (err) {
    console.error("❌ Flutterwave init error:", err.response?.data || err.message);
    res.status(500).json({ msg: "Payment initialization failed" });
  }
});

/**
 * Verify Payment (handles both API & manual payments)
 * Expects: { tx_ref, manual = false, amount, currency, publicUserId, platform }
 */
router.post("/verify", async (req, res) => {
  const { tx_ref, manual, amount, currency, publicUserId, platform } = req.body;

  if (!tx_ref && !manual) return res.status(400).json({ msg: "Missing tx_ref" });
  if (!process.env.FLW_SECRET_KEY) return res.status(500).json({ msg: "Server not configured properly" });

  try {
    const user = await User.findOne({ publicUserId });
    if (!user) return res.status(404).json({ msg: "User not found" });

    let coinsPurchased;

    // ===== Manual settlement =====
    if (manual) {
      if (!amount || !currency || !platform) return res.status(400).json({ msg: "Missing manual payment data" });

      const rate = currencyRates[currency] || 100;
      coinsPurchased = Math.round((amount / rate) * 10);
      coinsPurchased += getBonus(coinsPurchased);

      user.coins += coinsPurchased;
      await user.save();

      // Save transaction history
      const manualTx = new Transaction({
        publicUserId,
        amount,
        coins: coinsPurchased,
        currency,
        platform,
        tx_ref: `manual-${Date.now()}`,
      });
      await manualTx.save();

      // Send email
      sendEmail({
        to: user.email,
        subject: "💰 Payment Successful – Lumora Billing",
        html: paymentSuccessEmail(user.username || publicUserId, platform, amount, currency, coinsPurchased),
      }).catch(console.error);

      return res.json({ msg: "Manual payment credited successfully", coinsPurchased });
    }

    // ===== API payment verification =====
    const verifyRes = await axios.get(`${FLW_BASE_URL}/transactions/verify/${tx_ref}`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      validateStatus: false,
    });

    if (!verifyRes.data || !verifyRes.data.data) {
      console.warn("❌ Flutterwave verification response invalid:", verifyRes.data);
      return res.status(400).json({ msg: "Payment not found via API" });
    }

    const payload = verifyRes.data.data;
    if (payload.status !== "successful") return res.status(400).json({ msg: `Payment not successful. Status: ${payload.status}` });

    const rate = currencyRates[payload.currency] || 100;
    coinsPurchased = Math.round((payload.amount / rate) * 10);
    coinsPurchased += getBonus(coinsPurchased);

    user.coins += coinsPurchased;
    await user.save();

    // Save transaction history
    const apiTx = new Transaction({
      publicUserId,
      amount: payload.amount,
      coins: coinsPurchased,
      currency: payload.currency,
      platform,
      tx_ref,
    });
    await apiTx.save();

    // Send email
    sendEmail({
      to: user.email,
      subject: "💰 Payment Successful – Lumora Billing",
      html: paymentSuccessEmail(user.username || publicUserId, platform, payload.amount, payload.currency, coinsPurchased),
    }).catch(console.error);

    res.json({ msg: "Payment verified successfully", coinsPurchased });

  } catch (err) {
    console.error("❌ Payment verification error:", err.response?.data || err.message);
    res.status(500).json({ msg: "Payment verification failed" });
  }
});

module.exports = router;
