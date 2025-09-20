const express = require("express");
const router = express.Router();
const VaultX = require("vaultx-sdk");
const sendTicketEmail = require("../utils/endTicketEmail");
const GuestTicket = require("../models/GuestTicket");
const { guestTicketTemplate } = require("../utils/ticketEmailTemplate");
const multer = require("multer");

// Multer in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PNG, JPG, and PDF files are allowed"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const vaultx = new VaultX({
  publicUserId: process.env.VAULTX_PUBLIC_USERID || "mxapi_xsot4s1w",
  folder: process.env.VAULTX_FOLDER || "guest_tickets",
});

// Guest support endpoint
router.post("/guest", upload.array("attachments", 5), async (req, res) => {
  try {
    const { fullname, email, message } = req.body;

    if (!fullname || !email || !message) {
      return res.status(400).json({ success: false, msg: "Name, email, and message are required" });
    }

    if (!/^[A-Za-z\s]+$/.test(fullname)) {
      return res.status(400).json({ success: false, msg: "Name must contain only letters" });
    }

    if (!/^[\w.-]+@(gmail\.com|yahoo\.com|outlook\.com)$/.test(email)) {
      return res.status(400).json({ success: false, msg: "Email must be Gmail, Yahoo, or Outlook" });
    }

    let attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await vaultx.upload(process.env.VAULTX_FOLDER, file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
        attachments.push(uploaded.file.fileUrl);
      }
    }

    const ticket = await GuestTicket.create({
      fullname,
      email,
      message,
      attachments,
      status: "received"
    });

    await sendTicketEmail({
      to: email,
      subject: `🎫 We received your support request`,
      html: guestTicketTemplate(fullname, message, ticket._id.toString())
    });

    res.json({ success: true, msg: "Ticket created, check your inbox!" });
  } catch (err) {
    console.error("Guest support error:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

module.exports = router;
