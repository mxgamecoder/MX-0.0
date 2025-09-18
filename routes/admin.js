const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const VaultX = require("vaultx-sdk");
const sendAdminTicketEmail = require("../utils/adminTicketEmail");
const { ticketReplyTemplatee, ticketResolvedTemplate } = require("../utils/ticketEmailTemplate");

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
    const { message, adminName } = req.body;
    if (!message || !adminName) return res.status(400).json({ msg: "Message and admin name are required" });

    const ticket = await Ticket.findById(req.params.id).populate("userId", "username email");
    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

    // Save reply
    ticket.replies.push({
      userId: "admin",
      username: adminName,
      message,
      createdAt: new Date(),
      isAdmin: true
    });

    ticket.status = "answered";
    await ticket.save();

    // Send reply email
    await sendAdminTicketEmail({
      to: ticket.userId.email,
      subject: `💬 ${adminName} replied to your ticket: ${ticket.subject}`,
      html: ticketReplyTemplatee(
        ticket.userId.username,
        ticket.subject,
        message,
        ticket._id.toString(),
        adminName
      ),
    });

// 🕒 Auto resolve after 3 days
setTimeout(async () => {
  const t = await Ticket.findById(ticket._id).populate("userId", "username email");
  if (t && t.status === "answered") {
    t.status = "resolved";
    await t.save();

    // Send resolved email
    await sendAdminTicketEmail({
      to: t.userId.email,
      subject: `✅ Your ticket has been resolved: ${t.subject}`,
      html: ticketResolvedTemplate(
        t.userId.username,
        t.subject,
        t._id.toString()
      ),
    });
  }
}, 3 * 24 * 60 * 60 * 1000); // 🟢 3 days

    res.json({ msg: "✅ Reply sent (auto-resolve scheduled)", ticket });
  } catch (err) {
    console.error("Admin reply error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


module.exports = router;
