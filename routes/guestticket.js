const express = require("express");
const router = express.Router();
const VaultX = require("vaultx-sdk");
const sendTicketEmail = require("../utils/endTicketEmail");
const GuestTicket = require("../models/GuestTicket");
const { guestTicketTemplate } = require("../utils/ticketEmailTemplate");

const vaultx = new VaultX({
  publicUserId: process.env.VAULTX_PUBLIC_USERID || "mxapi_xsot4s1w",
  folder: process.env.VAULTX_FOLiDER || "guest_tickets",
});

// Guest support endpoint (NO multer, using req.files like in Ticket route)
router.post("/guest", async (req, res) => {
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
    if (req.files && req.files.attachments) {
      const files = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];
      if (files.length > 5) return res.status(400).json({ success: false, msg: "Max 5 files allowed" });

      for (const file of files) {
        const uploaded = await vaultx.upload(process.env.VAULTX_FOLiDER, file.data, {
          filename: file.name,
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

    res.json({ success: true, msg: "✅ Ticket created, check your inbox!" });
  } catch (err) {
    console.error("Guest support error:", err);
    res.status(500).json({ success: false, msg: "Server error: " + err.message });
  }
});

module.exports = router;
