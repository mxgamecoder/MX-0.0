// utils/ticketEmailTemplate.js

// Ticket Opened
const ticketEmailTemplate = (username, subject, category, type, ticketId) => `
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

    <div style="margin-top:20px; text-align:center;">
      <a href="https://lumoraid.vaultlite.name.ng/contact" 
         style="background:#9F7AEA; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">
         🌐 View Tickets
      </a>
    </div>
  </div>

  <p style="font-size:0.9em; color:#bbb; margin-top:20px; text-align:center;">
    Lumora Support Team <br/>
    <span style="color:#9F7AEA;">Lumora × MΞKΛ Core</span>
  </p>
</div>
`;

// Ticket Deleted
const ticketDeletedTemplate = (username, subject, category, type, ticketId) => `
<div style="font-family: Arial, sans-serif; color:#f1f1f1; background:#070607; line-height:1.6; padding:20px;">
  <div style="border:3px solid #9F7AEA; border-radius:8px; padding:20px;">
    <h2 style="color:#9F7AEA; margin-top:0;">🗑️ Ticket Deleted</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>Your ticket has been successfully <span style="color:#9F7AEA;">deleted</span> from our system.</p>

    <div style="background:#111; padding:15px; border-radius:6px; margin:15px 0; border:1px solid #9F7AEA;">
      <p><strong>📌 Subject:</strong> ${subject}</p>
      <p><strong>📂 Category:</strong> ${category}</p>
      <p><strong>🧾 Priority:</strong> ${type}</p>
      <p><strong>🔑 Ticket ID:</strong> ${ticketId}</p>
      <p><strong>Status:</strong> <span style="color:#9F7AEA;">Deleted ❌</span></p>
    </div>

    <div style="margin-top:20px; text-align:center;">
      <a href="https://lumoraid.vaultlite.name.ng/contact" 
         style="background:#9F7AEA; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">
         📩 Open New Ticket
      </a>
    </div>
  </div>

  <p style="font-size:0.9em; color:#bbb; margin-top:20px; text-align:center;">
    Lumora Support Team <br/>
    <span style="color:#9F7AEA;">Lumora × MΞKΛ Core</span>
  </p>
</div>
`;

// Ticket Replied
const ticketReplyTemplate = (username, subject, replyMessage, ticketId) => `
<div style="font-family: Arial, sans-serif; color:#f1f1f1; background:#070607; line-height:1.6; padding:20px;">
  <div style="border:3px solid #9F7AEA; border-radius:8px; padding:20px;">
    <h2 style="color:#9F7AEA; margin-top:0;">💬 Ticket Replied</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>A new reply was added to your ticket.</p>

    <div style="background:#111; padding:15px; border-radius:6px; margin:15px 0; border:1px solid #9F7AEA;">
      <p><strong>📌 Subject:</strong> ${subject}</p>
      <p><strong>🔑 Ticket ID:</strong> ${ticketId}</p>
      <p><strong>💬 Reply:</strong></p>
      <blockquote style="color:#ddd; margin:10px 0; padding:10px; background:#1a1a1a; border-left:4px solid #9F7AEA;">
        ${replyMessage}
      </blockquote>
      <p><strong>Status:</strong> <span style="color:#9F7AEA;">Answered ✅</span></p>
    </div>

    <div style="margin-top:20px; text-align:center;">
      <a href="https://lumoraid.vaultlite.name.ng/contact" 
         style="background:#9F7AEA; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">
         🌐 View Ticket
      </a>
    </div>
  </div>

  <p style="font-size:0.9em; color:#bbb; margin-top:20px; text-align:center;">
    Lumora Support Team <br/>
    <span style="color:#9F7AEA;">Lumora × MΞKΛ Core</span>
  </p>
</div>
`;

// Ticket Replied by Admin
const ticketReplyTemplatee = (username, subject, replyMessage, ticketId, adminName) => `
<div style="font-family: Arial, sans-serif; color:#f1f1f1; background:#070607; line-height:1.6; padding:20px;">
  <div style="border:3px solid #9F7AEA; border-radius:8px; padding:20px;">
    <h2 style="color:#9F7AEA; margin-top:0;">💬 Ticket Replied</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>Our support agent <strong style="color:#9F7AEA;">${adminName}</strong> has replied to your ticket.</p>

    <div style="background:#111; padding:15px; border-radius:6px; margin:15px 0; border:1px solid #9F7AEA;">
      <p><strong>📌 Subject:</strong> ${subject}</p>
      <p><strong>🔑 Ticket ID:</strong> ${ticketId}</p>
      <p><strong>💬 Reply from ${adminName}:</strong></p>
      <blockquote style="color:#ddd; margin:10px 0; padding:10px; background:#1a1a1a; border-left:4px solid #9F7AEA;">
        ${replyMessage}
      </blockquote>
      <p><strong>Status:</strong> <span style="color:#9F7AEA;">Answered ✅</span></p>
    </div>

    <div style="margin-top:20px; text-align:center;">
      <a href="https://lumoraid.vaultlite.name.ng/contact" 
         style="background:#9F7AEA; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">
         🌐 View Ticket
      </a>
    </div>
  </div>

  <p style="font-size:0.9em; color:#bbb; margin-top:20px; text-align:center;">
    Answered by <strong style="color:#9F7AEA;">${adminName}</strong><br/>
    Lumora Support Team <br/>
    <span style="color:#9F7AEA;">Lumora × MΞKΛ Core</span>
  </p>
</div>
`;

// Ticket Resolved
const ticketResolvedTemplate = (username, subject, ticketId) => `
<div style="font-family: Arial, sans-serif; color:#f1f1f1; background:#070607; line-height:1.6; padding:20px;">
  <div style="border:3px solid #48BB78; border-radius:8px; padding:20px;">
    <h2 style="color:#48BB78; margin-top:0;">✅ Ticket Resolved</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>Your ticket has been marked as <span style="color:#48BB78;">Resolved</span>.</p>

    <div style="background:#111; padding:15px; border-radius:6px; margin:15px 0; border:1px solid #48BB78;">
      <p><strong>📌 Subject:</strong> ${subject}</p>
      <p><strong>🔑 Ticket ID:</strong> ${ticketId}</p>
      <p><strong>Status:</strong> <span style="color:#48BB78;">Resolved ✅</span></p>
    </div>

    <div style="margin-top:20px; text-align:center;">
      <a href="https://lumoraid.vaultlite.name.ng/contact" 
         style="background:#48BB78; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">
         📩 Open New Ticket
      </a>
    </div>
  </div>

  <p style="font-size:0.9em; color:#bbb; margin-top:20px; text-align:center;">
    Lumora Support Team <br/>
    <span style="color:#48BB78;">Lumora × MΞKΛ Core</span>
  </p>
</div>
`;

// Guest Ticket
const guestTicketTemplate = (fullname, message, ticketId) => `
<div style="font-family: Arial, sans-serif; color:#f1f1f1; background:#070607; line-height:1.6; padding:20px;">
  <div style="border:3px solid #9F7AEA; border-radius:8px; padding:20px;">
    <h2 style="color:#9F7AEA; margin-top:0;">📩 Support Request Received</h2>
    <p>Hello <strong>${fullname}</strong>,</p>
    <p>We have received your support request. Here are the details you submitted:</p>

    <div style="background:#111; padding:15px; border-radius:6px; margin:15px 0; border:1px solid #9F7AEA;">
      <p><strong>📝 Message:</strong></p>
      <blockquote style="color:#ddd; margin:10px 0; padding:10px; background:#1a1a1a; border-left:4px solid #9F7AEA;">
        ${message}
      </blockquote>
      <p><strong>🔑 Ticket ID:</strong> ${ticketId}</p>
      <p><strong>Status:</strong> <span style="color:#9F7AEA;">Received ⏳</span></p>
    </div>

    <p>Our support team will reply to you as soon as possible 🙏💬</p>
  </div>

  <p style="font-size:0.9em; color:#bbb; margin-top:20px; text-align:center;">
    Lumora Support Team <br/>
    <span style="color:#9F7AEA;">Lumora × MΞKΛ Core</span>
  </p>
</div>
`;

// Guest Reply
const guestReplyTemplate = (fullname, replyMessage, adminName, ticketId) => `
<div style="font-family: Arial, sans-serif; color:#f1f1f1; background:#070607; line-height:1.6; padding:20px;">
  <div style="border:3px solid #9F7AEA; border-radius:8px; padding:20px;">
    <h2 style="color:#9F7AEA; margin-top:0;">💬 Support Response</h2>
    <p>Hello <strong>${fullname}</strong>,</p>
    <p>Our support agent <strong style="color:#9F7AEA;">${adminName}</strong> has replied to your request:</p>

    <div style="background:#111; padding:15px; border-radius:6px; margin:15px 0; border:1px solid #9F7AEA;">
      <p><strong>💬 Reply:</strong></p>
      <blockquote style="color:#ddd; margin:10px 0; padding:10px; background:#1a1a1a; border-left:4px solid #9F7AEA;">
        ${replyMessage}
      </blockquote>
      <p><strong>🔑 Ticket ID:</strong> ${ticketId}</p>
      <p><strong>Status:</strong> <span style="color:#9F7AEA;">Answered ✅</span></p>
    </div>

    <p>If you have more questions, feel free to contact our support team again 🙏💬</p>
  </div>

  <p style="font-size:0.9em; color:#bbb; margin-top:20px; text-align:center;">
    Lumora Support Team <br/>
    <span style="color:#9F7AEA;">Lumora × MΞKΛ Core</span>
  </p>
</div>
`;

module.exports = {
  ticketEmailTemplate,
  ticketDeletedTemplate,
  ticketReplyTemplate,
  ticketReplyTemplatee,
  ticketResolvedTemplate,
  guestTicketTemplate,
  guestReplyTemplate
};
