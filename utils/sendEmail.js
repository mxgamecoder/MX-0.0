const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send HTML email
 * @param {string} to - Receiver email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 */
const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"MXAPI 👑" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html, // send HTML for styling
  };

  try {
    await transporter.sendMail(mailOptions);
    //console.log(`📨 Email sent to ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error('❌ Failed to send email:', err);
  }
};

module.exports = sendEmail;
