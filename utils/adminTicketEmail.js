// utils/adminTicketEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ✅ Verify once at startup
transporter.verify((error) => {
  if (error) {
    console.error("❌ Admin SMTP config error:", error);
  } else {
    console.log("✅ Admin mail server is ready");
  }
});

const sendAdminTicketEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"Lumora Admin Support 👨‍💻" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("❌ Admin ticket email error:", err.message);
  }
};

module.exports = sendAdminTicketEmail;
