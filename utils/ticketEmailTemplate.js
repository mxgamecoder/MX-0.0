// utils/ticketEmailTemplate.js

const ticketEmailTemplate = (username, subject, category, type, ticketId) => {
  return `
  <div style="font-family: Arial, sans-serif; color:#f1f1f1; background:#070607; line-height:1.6; padding:20px;">
    
    <div style="border:3px solid #9F7AEA; border-radius:8px; padding:20px;">
      <h2 style="color:#9F7AEA; margin-top:0;">🎫 Ticket Opened</h2>
      <p>Hello <strong>${username}</strong>,</p>
      <p>Thank you for contacting our support team. A ticket has been opened for your request. You will be notified by email when a response is made.</p>

      <div style="background:#111; padding:15px; border-radius:6px; margin:15px 0; border:1px solid #9F7AEA;">
        <p><strong>📌 Subject:</strong> ${subject}</p>
        <p><strong>📂 Category:</strong> ${category}</p>
        <p><strong>🧾 Priority:</strong> ${type}</p>
        <p><strong>🔑 Ticket ID:</strong> ${ticketId}</p>
        <p><strong>Status:</strong> <span style="color:#9F7AEA;">Checking ⏳</span></p>
      </div>

      <p>We will reply to you shortly 🙏💬📩</p>

      <p style="margin-top:20px;">
        You can view your ticket anytime at:<br/>
        <a href="https://lumoraid.vaultlite.name.ng/contact" style="color:#9F7AEA; text-decoration:none;">
          https://lumoraid.vaultlite.name.ng/contact
        </a>
      </p>

      <div style="margin-top:20px; text-align:center;">
        <a href="https://lumoraid.vaultlite.name.ng" 
           style="background:#9F7AEA; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">
           🌐 Visit Site
        </a>
      </div>
    </div>

    <p style="font-size:0.9em; color:#bbb; margin-top:20px; text-align:center;">
      Lumora Support Team <br/>
      <span style="color:#9F7AEA;">Lumora × MΞKΛ Core</span>
    </p>
  </div>
  `;
};

module.exports = ticketEmailTemplate;
