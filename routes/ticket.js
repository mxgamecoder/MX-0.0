const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const authenticate = require("../middleware/auth");
const VaultX = require("vaultx-sdk");
const User = require("../models/User");
const sendEmail = require('../utils/sendEmail');
const vaultx = new VaultX({
  publicUserId: process.env.VAULTX_PUBLIC_USERID || "mxapi_xsot4s1w",
  folder: process.env.VAULTX_FOLDERr || "tickets",
});

// Create Ticket
router.post("/", authenticate, async (req, res) => {
  try {
    const { subject, message, type, reason } = req.body;
    if (!subject || !message || !type) {
      return res.status(400).json({ msg: "Subject, message, and type are required" });
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
      reason,
      attachments,
    });

    await ticket.save();

    // Send email notification
    await sendEmail({
      to: user.email,
      subject: `We received your ticket: ${subject}`,
      text: `Hello ${user.username},\n\nWe have received your complaint regarding: "${subject}". Our team will start reviewing it immediately.\n\nThank you.`,
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
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });
    if (ticket.userId.toString() !== req.user.id) return res.status(403).json({ msg: "Forbidden" });
    res.json({ ticket });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
