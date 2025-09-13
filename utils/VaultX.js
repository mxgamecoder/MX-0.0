const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

async function sedEmail(to, subject, html) {
  await transporter.sendMail({
    from: `"VaultX 🔐" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}

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
        <p>We’re excited to let you know that your upgrade to the <b style="color:#facc15;">${plan.toUpperCase()}</b> plan was successful.</p>
        <p>Your encrypted storage space is now active with more room, faster sync speeds, and added reliability. You can continue uploading and securing your files without interruption.</p>
        <p>Please note: this subscription will remain active for <b>${daysRemaining} days</b>. After that, it will require renewal to maintain premium benefits.</p>
        <p>If you ever need to check your plan status or manage renewals, simply visit your VaultX dashboard at <a href="https://vaultlite.name.ng/dashboard" style="color:#9F7AEA;">vaultlite.name.ng/dashboard</a>.</p>
        <br/>
        <p>Thanks again for trusting VaultX with your files.</p>
        <p>Stay secured,<br/>The VaultX Team 🚀</p>
      </div>
    `;
  }

  if (type === "expiry-warning") {
    return `
      <div style="${baseStyle}">
        <h2 style="color:#facc15;">VaultX Expiry Notice ⚠️</h2>
        <p>Hi <b>@${username}</b>,</p>
        <p>This is a friendly reminder that your <b>${plan.toUpperCase()}</b> plan will expire in <b>${daysRemaining} days</b>.</p>
        <p>To keep enjoying premium features like extended storage, fast uploads, and secure multi-mirror backups, please ensure you renew your plan before it lapses.</p>
        <p>You can renew quickly by visiting your VaultX dashboard at <a href="https://vaultlite.name.ng/dashboard" style="color:#9F7AEA;">vaultlite.name.ng/dashboard</a>.</p>
        <p>Visiting the site is all you need to do to continue with your plan renewal.</p>
        <br/>
        <p>Thanks for choosing VaultX! We appreciate your trust in keeping your files safe.</p>
      </div>
    `;
  }

  if (type === "expired") {
    return `
      <div style="${baseStyle}">
        <h2 style="color:#dc2626;">VaultX Plan Expired ❌</h2>
        <p>Hi <b>@${username}</b>,</p>
        <p>Your <b>${plan.toUpperCase()}</b> plan has now expired, and your account has been moved back to the <b>FREE</b> tier.</p>
        <p>That means reduced storage and limited access to premium features. To regain access to your full encrypted storage and backups, we recommend upgrading again.</p>
        <p>You can reactivate your subscription at any time by visiting your dashboard here: <a href="https://vaultlite.name.ng/dashboard" style="color:#9F7AEA;">vaultlite.name.ng/dashboard</a>.</p>
        <br/>
        <p>We look forward to having you back on premium soon.</p>
        <p>Stay secured,<br/>The VaultX Team 🔐</p>
      </div>
    `;
  }
}
module.exports = { sedEmail, planEmailTemplate };
