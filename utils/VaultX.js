// utils/VaultX.js
const nodemailer = require("nodemailer");
require('dotenv').config(); // make sure env is loaded

// ----------------------
// Create transporter
// ----------------------
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 465, // fallback to 465
  secure: process.env.EMAIL_SECURE === 'true', // SSL true/false
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection on server start
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ VaultX SMTP config error:", error);
  } else {
    console.log("✅ VaultX SMTP server is ready to take messages");
    console.log("VaultX transporter config:", {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE,
      user: process.env.EMAIL_USER,
    });
  }
});

// ----------------------
// Send email function
// ----------------------
async function sedEmail(to, subject, html) {
  const mailOptions = {
    from: `"VaultX 🔐" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📨 VaultX Email sent to ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error("❌ VaultX failed to send email:", err);
  }
}

// ----------------------
// Email templates
// ----------------------
function planEmailTemplate({ username, plan, daysRemaining, type }) {
  const baseStyle = `
    font-family: Poppins, Arial, sans-serif;
    background:#0f0f0f;
    color:#fff;
    padding:20px;
    border-top:4px solid #9F7AEA;
    border-bottom:4px solid #9F7AEA;
  `;

  if (type === "purchase") {
    return `
      <div style="${baseStyle}">
        <h2 style="color:#4f46e5;">VaultX 🔐</h2>
        <p>Hi <b>@${username}</b>,</p>
        <p>Your upgrade to <b style="color:#facc15;">${plan.toUpperCase()}</b> plan was successful.</p>
        <p>Your encrypted storage space is now active for <b>${daysRemaining} days</b>.</p>
        <p>Visit your VaultX dashboard at <a href="https://vaultlite.name.ng/dashboard" style="color:#9F7AEA;">vaultlite.name.ng/dashboard</a>.</p>
        <br/>
        <p>Stay secured,<br/>The VaultX Team 🚀</p>
      </div>
    `;
  }

  if (type === "expiry-warning") {
    return `
      <div style="${baseStyle}">
        <h2 style="color:#facc15;">VaultX Expiry Notice ⚠️</h2>
        <p>Hi <b>@${username}</b>,</p>
        <p>Your <b>${plan.toUpperCase()}</b> plan will expire in <b>${daysRemaining} days</b>.</p>
        <p>Renew your plan at <a href="https://vaultlite.name.ng/dashboard" style="color:#9F7AEA;">vaultlite.name.ng/dashboard</a>.</p>
        <br/>
        <p>Thanks for choosing VaultX!</p>
      </div>
    `;
  }

  if (type === "expired") {
    return `
      <div style="${baseStyle}">
        <h2 style="color:#dc2626;">VaultX Plan Expired ❌</h2>
        <p>Hi <b>@${username}</b>,</p>
        <p>Your <b>${plan.toUpperCase()}</b> plan has expired. You are now on the FREE tier.</p>
        <p>Reactivate your plan at <a href="https://vaultlite.name.ng/dashboard" style="color:#9F7AEA;">vaultlite.name.ng/dashboard</a>.</p>
        <br/>
        <p>Stay secured,<br/>The VaultX Team 🔐</p>
      </div>
    `;
  }
}

module.exports = { sedEmail, planEmailTemplate };
