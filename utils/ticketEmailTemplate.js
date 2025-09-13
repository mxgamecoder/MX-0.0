// utils/templates/ticketEmailTemplate.js

const ticketEmailTemplate = (username, subject, message, ticketId) => {
  return `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <h2 style="color: #6C5CE7;">🎫 Ticket Created Successfully</h2>
    <p>Hi <strong>${username}</strong>,</p>
    <p>Your ticket has been received. Our support team will review it as soon as possible.</p>

    <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin:15px 0;">
      <p><strong>📌 Subject:</strong> ${subject}</p>
      <p><strong>📝 Message:</strong> ${message}</p>
      <p><strong>🔑 Ticket ID:</strong> ${ticketId}</p>
    </div>

    <p>Status: <strong style="color:#0984e3;">Checking</strong></p>

    <p>We’ll notify you once there’s an update. Thank you for your patience 🙏</p>

    <hr />
    <p style="font-size:0.9em; color:#636e72;">
      VaultX Support Team <br/>
      <span style="color:#6C5CE7;">Lumora × MΞKΛ Core</span>
    </p>
  </div>
  `;
};

module.exports = ticketEmailTemplate;
