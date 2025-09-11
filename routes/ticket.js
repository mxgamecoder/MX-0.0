const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const authenticate = require("../middleware/auth");
const VaultX = require("vaultx-sdk");

const vaultx = new VaultX({
  publicUserId: process.env.VAULTX_PUBLIC_USERID || "mxapi_xsot4s1w",
  folder: process.env.VAULTX_FOLDERr || "tickets",
});

// Create Ticket
router.post("/", authenticate, async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ msg: "Subject and message are required" });
    }

    let attachments = [];
    if (req.files && req.files.attachments) {
      const files = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];
      if (files.length > 5) return res.status(400).json({ msg: "Max 5 files allowed" });

      for (const file of files) {
        const uploaded = await vaultx.upload(process.env.VAULTX_FOLDER, file.data, {
          filename: file.name,
          contentType: file.mimetype,
        });
        attachments.push(uploaded.file.fileUrl);
      }
    }

    const ticket = new Ticket({
      userId: req.user.id,
      username: req.user.username,
      subject,
      message,
      attachments,
    });

    await ticket.save();
    res.json({ msg: "✅ Ticket created", ticket });
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
