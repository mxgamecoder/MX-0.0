const mongoose = require("mongoose");

const GuestTicketSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  attachments: [String],
  status: { type: String, default: "received" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GuestTicket", GuestTicketSchema);
