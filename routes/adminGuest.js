const express = require("express");
const router = express.Router();
const GuestTicket = require("../models/GuestTicket");
const sendAdminTicketEmail = require("../utils/adminTicketEmail");
const { guestReplyTemplate } = require("../utils/ticketEmailTemplate");

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
// Reply to guest ticket and delete instantly
// =====================
router.post("/guest-tickets/:id/reply", async (req, res) => {
  try {
    const { message, adminName } = req.body;
    if (!message || !adminName)
      return res.status(400).json({ msg: "Message and admin name are required" });

    const ticket = await GuestTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

    // Send reply email to guest using guest template
    await sendAdminTicketEmail({
      to: ticket.email,
      subject: `💬 ${adminName} replied to your support request`,
      html: guestReplyTemplate(ticket.fullname, message, adminName, ticket._id.toString()),
    });

    // Delete ticket instantly since it's a guest
    await GuestTicket.findByIdAndDelete(ticket._id);

    res.json({ msg: "✅ Reply sent and guest ticket deleted successfully" });
  } catch (err) {
    console.error("Admin reply guest ticket error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
