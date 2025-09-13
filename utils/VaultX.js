const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

async function sedEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"VaultX 🔐" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`📨 VaultX email sent to ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error("❌ VaultX email failed:", err);
  }
}

function planEmailTemplate({ username, plan, daysRemaining, type }) {
  if (type === "purchase") {
    return `
      <div style="font-family:Poppins,Arial,sans-serif; background:#0f0f0f; color:#fff; padding:20px;">
        <h2 style="color:#4f46e5;">VaultX 🔐</h2>
        <p>Hi <b>@${username}</b>,</p>
        <p>🎉 Congratulations! You’ve successfully upgraded to the <b style="color:#facc15;">${plan.toUpperCase()}</b> plan.</p>
        <p>Your premium storage is now active. Enjoy your encrypted files with more space, faster speeds, and peace of mind.</p>
        <p>⏳ This plan will expire in <b>${daysRemaining} days</b>.</p>
        <br/>
        <p>Stay secured,<br/>The VaultX Team 🚀</p>
      </div>
    `;
  }

  if (type === "expiry-warning") {
    return `
      <div style="font-family:Poppins,Arial,sans-serif; background:#0f0f0f; color:#fff; padding:20px;">
        <h2 style="color:#facc15;">VaultX Expiry Notice ⚠️</h2>
        <p>Hi <b>@${username}</b>,</p>
        <p>Your <b>${plan.toUpperCase()}</b> plan will expire in <b>${daysRemaining} days</b>.</p>
        <a href="https://vaultlite.name.ng/dashboard" 
           style="display:inline-block; margin-top:10px; padding:10px 20px; background:#4f46e5; color:#fff; border-radius:8px; text-decoration:none;">
          🔄 Renew Plan
        </a>
        <br/><br/>
        <p>Thanks for choosing VaultX!</p>
      </div>
    `;
  }

  if (type === "expired") {
    return `
      <div style="font-family:Poppins,Arial,sans-serif; background:#0f0f0f; color:#fff; padding:20px;">
        <h2 style="color:#dc2626;">VaultX Plan Expired ❌</h2>
        <p>Hi <b>@${username}</b>,</p>
        <p>Your <b>${plan.toUpperCase()}</b> plan has expired. You’ve been downgraded to the <b>FREE</b> tier.</p>
        <a href="https://vaultlite.name.ng/dashboard" 
           style="display:inline-block; margin-top:10px; padding:10px 20px; background:#facc15; color:#000; border-radius:8px; text-decoration:none;">
          🚀 Upgrade Now
        </a>
        <br/><br/>
        <p>Stay secured,<br/>The VaultX Team 🔐</p>
      </div>
    `;
  }
}

module.exports = { sedEmail, planEmailTemplate };
