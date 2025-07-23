const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email
 * @param {string} to - Receiver email
 * @param {string} subject - Email subject
 * @param {string} text - Email body text
 */
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: `"MXAPI 👑" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;