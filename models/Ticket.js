const mongoose = require("mongoose");

const ReplySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true }, // 👈 allows ObjectId OR string
  username: { type: String, required: true },
  message: { type: String, required: true },
  attachments: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const TicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String, required: true },
  attachments: [{ type: String }],
  status: { type: String, default: "open" },
  replies: [ReplySchema],   // 🟢 add this line
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Ticket", TicketSchema);
