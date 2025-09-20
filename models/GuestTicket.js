// models/GuestTicket.js
const mongoose = require("mongoose");

const GuestTicketSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    attachments: [String],
    status: { type: String, default: "received" },
    replies: [
      {
        username: String,
        message: String,
        createdAt: { type: Date, default: Date.now },
        isAdmin: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("GuestTicket", GuestTicketSchema);
