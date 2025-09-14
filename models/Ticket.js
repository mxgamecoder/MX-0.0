const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true }, // New type field
  category: { type: String, required: true }, // Optional common reason
  status: { type: String, enum: ["pending", "checking", "resolved"], default: "pending" },
  attachments: [{ type: String }], // VaultX file URLs
}, { timestamps: true });

module.exports = mongoose.model("Ticket", TicketSchema);
