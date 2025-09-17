// utils/adminTicketEmail.js
const nodemailer = require("nodemailer");

const sendAdminTicketEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT), // 👈 force number
      secure: process.env.EMAIL_SECURE === "true", // true if port 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // cPanel/self-signed certs
      },
    });

    const mailOptions = {
      from: `"Lumora Admin Support 👨‍💻" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    // console.log(`📨 Admin email sent to ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error("❌ Admin ticket email error:", err.message);
  }
};

module.exports = sendAdminTicketEmail;
