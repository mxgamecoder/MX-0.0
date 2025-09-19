const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  publicUserId: { type: String, required: true },
  amount: { type: Number, required: true },
  coins: { type: Number, required: true },
  currency: { type: String, required: true },
  platform: { type: String, required: true },
  tx_ref: { type: String },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);
