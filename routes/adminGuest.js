const express = require("express");
const router = express.Router();
const GuestTicket = require("../models/GuestTicket");
const sendAdminTicketEmail = require("../utils/adminTicketEmail");
const { ticketReplyTemplatee, ticketResolvedTemplate } = require("../utils/ticketEmailTemplate");

// =====================
// Fetch ALL guest tickets
// =====================
router.get("/guest-tickets", async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const tickets = await GuestTicket.find(query).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (err) {
    console.error("Admin fetch guest tickets error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// =====================
// Fetch single guest ticket
// =====================
router.get("/guest-tickets/:id", async (req, res) => {
  try {
    const ticket = await GuestTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

    res.json({ ticket });
  } catch (err) {
    console.error("Admin fetch guest ticket error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// =====================
// Reply to guest ticket
// =====================
router.post("/guest-tickets/:id/reply", async (req, res) => {
  try {
    const { message, adminName } = req.body;
    if (!message || !adminName) return res.status(400).json({ msg: "Message and admin name are required" });

    const ticket = await GuestTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

    // Save reply
    ticket.replies.push({
      username: adminName,
      message,
      createdAt: new Date(),
      isAdmin: true,
    });

    ticket.status = "answered";
    await ticket.save();

    // Send reply email to guest
    await sendAdminTicketEmail({
      to: ticket.email,
      subject: `💬 ${adminName} replied to your support request`,
      html: ticketReplyTemplatee(
        ticket.fullname,
        "Guest Support Request",
        message,
        ticket._id.toString(),
        adminName
      ),
    });

    // Auto resolve after 3 days
    setTimeout(async () => {
      const t = await GuestTicket.findById(ticket._id);
      if (t && t.status === "answered") {
        t.status = "resolved";
        await t.save();

        // Send resolved email
        await sendAdminTicketEmail({
          to: t.email,
          subject: `✅ Your guest support request has been resolved`,
          html: ticketResolvedTemplate(
            t.fullname,
            "Guest Support Request",
            t._id.toString()
          ),
        });
      }
    }, 3 * 24 * 60 * 60 * 1000); // 3 days

    res.json({ msg: "✅ Reply sent (auto-resolve scheduled)", ticket });
  } catch (err) {
    console.error("Admin reply guest ticket error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
