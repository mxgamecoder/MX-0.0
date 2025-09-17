const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const VaultX = require("vaultx-sdk");
const sendTicketEmail = require("../utils/endTicketEmail");
const { ticketReplyTemplate } = require("../utils/ticketEmailTemplate");

// You can add authentication middleware for admin (role-based check)
// e.g., require("../middleware/adminAuth");

const vaultx = new VaultX({
  publicUserId: process.env.VAULTX_PUBLIC_USERID || "mxapi_xsot4s1w",
  folder: process.env.VAULTX_FOLDERr || "tickets",
});

// Get ALL tickets (admin)
router.get("/tickets", async (req, res) => {
  try {
    const { status, type, category } = req.query;
    let query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (category) query.category = category;

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (err) {
    console.error("Admin fetch tickets error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get single ticket detail (admin)
router.get("/tickets/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate("userId", "username email");
    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });
    res.json({ ticket });
  } catch (err) {
    console.error("Admin fetch ticket error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Reply to a ticket (admin)
router.post("/tickets/:id/reply", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ msg: "Message is required" });

    const ticket = await Ticket.findById(req.params.id).populate("userId", "username email");
    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

    // Handle attachments (optional)
    let attachments = [];
    if (req.files && req.files.attachments) {
      const files = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];
      if (files.length > 3) return res.status(400).json({ msg: "Max 3 files allowed" });

      for (const file of files) {
        const uploaded = await vaultx.upload(process.env.VAULTX_FOLDERr, file.data, {
          filename: file.name,
          contentType: file.mimetype,
        });
        attachments.push(uploaded.file.fileUrl);
      }
    }

    // Push admin reply
    ticket.replies.push({
      userId: "admin",
      username: "Support Team",
      message,
      attachments,
      createdAt: new Date()
    });

    ticket.status = "answered";
    await ticket.save();

    // Send email to user
    await sendTicketEmail({
      to: ticket.userId.email,
      subject: `💬 Support replied to your ticket: ${ticket.subject}`,
      html: ticketReplyTemplate(ticket.userId.username, ticket.subject, message, ticket._id.toString()),
    });

    res.json({ msg: "✅ Reply sent", ticket });
  } catch (err) {
    console.error("Admin reply error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
