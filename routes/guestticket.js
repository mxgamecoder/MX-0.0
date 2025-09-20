const express = require("express");
const router = express.Router();
const VaultX = require("vaultx-sdk");
const sendTicketEmail = require("../utils/endTicketEmail");
const GuestTicket = require("../models/GuestTicket"); // create a separate model for guest tickets
const { guestTicketTemplate } = require("../utils/ticketEmailTemplate");
const multer = require("multer");
const upload = multer();

const vaultx = new VaultX({
  publicUserId: process.env.VAULTX_PUBLIC_USERID || "mxapi_xsot4s1w",
  folder: process.env.VAULTX_FOLiDER || "guest_tickets",
});

// Guest support endpoint
router.post("/guest", upload.array("attachments", 5), async (req, res) => {
  try {
    const { fullname, email, message } = req.body;
    if (!fullname || !email || !message) {
      return res.status(400).json({ msg: "Name, email, and message are required" });
    }

    // Handle attachments
    let attachments = [];
    if (req.files && req.files.length > 0) {
      if (req.files.length > 5) {
        return res.status(400).json({ msg: "Max 5 files allowed" });
      }

      for (const file of req.files) {
        const uploaded = await vaultx.upload(process.env.VAULTX_FOLiDER, file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
        attachments.push(uploaded.file.fileUrl);
      }
    }

    // Save guest ticket in DB
    const ticket = await GuestTicket.create({
      fullname,
      email,
      message,
      attachments,
      status: "received"
    });

    // Send email confirmation
    await sendTicketEmail({
      to: email,
      subject: `🎫 We received your support request`,
      html: guestTicketTemplate(fullname, message, ticket._id.toString())
    });

    res.json({ success: true, msg: "Ticket created, check your inbox!" });
  } catch (err) {
    console.error("Guest support error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

module.exports = router;
