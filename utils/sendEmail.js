const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // use Gmail service directly
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
    from: `"MXAPI 👑" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📨 Email sent to ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error("❌ Failed to send email:", err);
  }
};

// verify Gmail connection on server start
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP config error:", error);
  } else {
    console.log("✅ Gmail SMTP is ready to send messages");
  }
});

module.exports = sendEmail;
