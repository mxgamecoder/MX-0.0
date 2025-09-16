const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const authenticate = require("../middleware/auth");
const VaultX = require("vaultx-sdk");
const User = require("../models/User");
const sendTicketEmail = require("../utils/endTicketEmail");
const { ticketEmailTemplate, ticketDeletedTemplate, ticketReplyTemplate } = require("../utils/ticketEmailTemplate");
const vaultx = new VaultX({
  publicUserId: process.env.VAULTX_PUBLIC_USERID || "mxapi_xsot4s1w",
  folder: process.env.VAULTX_FOLDERr || "tickets",
});

// Create Ticket
router.post("/", authenticate, async (req, res) => {
  try {
    const { subject, message, type, category } = req.body;
    if (!subject || !message || !type || !category) {
      return res.status(400).json({ msg: "Subject, message, category, and type are required" });
    }

    // Fetch user info
    const user = await User.findById(req.user.id).select("username email");
    if (!user) return res.status(404).json({ msg: "User not found" });

    let attachments = [];
    if (req.files && req.files.attachments) {
      const files = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];
      if (files.length > 5) return res.status(400).json({ msg: "Max 5 files allowed" });

      for (const file of files) {
        const uploaded = await vaultx.upload(process.env.VAULTX_FOLDERr, file.data, {
          filename: file.name,
          contentType: file.mimetype,
        });
        attachments.push(uploaded.file.fileUrl);
      }
    }

    // Create ticket
    const ticket = new Ticket({
      userId: req.user.id,
      username: user.username,
      subject,
      message,
      type,
      category,
      attachments,
    });

    await ticket.save();

    // Send email notification
    await sendTicketEmail({
      to: user.email,
      subject: `🎫 We received your ticket: ${subject}`,
      html: ticketEmailTemplate(user.username, subject, category, message, ticket._id.toString()),
    });

    // Update status to checking
    ticket.status = "checking";
    await ticket.save();

    res.json({ msg: "✅ Ticket created and email sent", ticket });
  } catch (err) {
    console.error("Ticket create error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get all tickets for logged-in user
router.get("/", authenticate, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get single ticket detail
router.get("/:id", authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.user.id })
      .select("subject message type category attachments username status createdAt");
    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });
    res.json({ ticket });
  } catch (err) {
    console.error("Ticket fetch error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// 🗑️ Delete ticket
router.delete("/:id", authenticate, async (req, res) => {
  try {
    // Find the ticket first
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.user.id });
    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

    // Fetch user info
    const user = await User.findById(req.user.id).select("username email");
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Delete the ticket
    await ticket.deleteOne();

    // Send deletion email
    await sendTicketEmail({
      to: user.email,
      subject: `🗑️ Ticket Deleted: ${ticket.subject}`,
      html: ticketDeletedTemplate(user.username, ticket.subject, ticket.category, ticket.type, ticket._id.toString()),
    });

    res.json({ msg: "🗑️ Ticket deleted and email sent" });
  } catch (err) {
    console.error("Ticket delete error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Reply to a ticket
router.post("/reply", authenticate, async (req, res) => {
  try {
    const { ticketId, message } = req.body;
    if (!ticketId || !message) {
      return res.status(400).json({ msg: "Ticket ID and message are required" });
    }

    // Find ticket
    const ticket = await Ticket.findOne({ _id: ticketId, userId: req.user.id });
    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

    // Handle attachments
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

    // Add reply
    ticket.replies.push({
      userId: req.user.id,
      username: req.user.username,
      message,
      attachments,
      createdAt: new Date()
    });

    // Update ticket status
    ticket.status = "answered";
    await ticket.save();

    // Fetch user info
    const user = await User.findById(req.user.id).select("username email");

    // Send email
    await sendTicketEmail({
      to: user.email,
      subject: `💬 Reply added to your ticket: ${ticket.subject}`,
      html: ticketReplyTemplate(user.username, ticket.subject, message, ticket._id.toString()),
    });

    res.json({ msg: "✅ Reply added", ticket });
  } catch (err) {
    console.error("Ticket reply error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
