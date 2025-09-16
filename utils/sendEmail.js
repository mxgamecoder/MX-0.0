const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email (supports both text + html)
 * @param {Object} options
 * @param {string} options.to - Receiver email
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text content
 * @param {string} [options.html] - HTML content
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: `"Lumora 👑" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text, // plain text (fallback)
    html, // optional (for styled emails)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📨 Email sent to ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error("❌ Failed to send email:", err);
  }
};

// verify connection on server start
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP config error:", error);
  } else {
    console.log("✅ SMTP server is ready to take messages");
  }
});

module.exports = sendEmail;
