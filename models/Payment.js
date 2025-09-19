const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  publicUserId: { type: String, required: true },
  platform: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "NGN" },
  status: { type: String, default: "pending" },
  tx_ref: { type: String, required: true },
  coins: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Payment", paymentSchema);
