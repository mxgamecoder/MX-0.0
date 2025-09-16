const nodemailer = require("nodemailer");

const sendTicketEmail = async ({ to, subject, html }) => {
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
      from: `"Lumora Support 🎫" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
   //console.log(`📨 Ticket email sent to ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error("❌ Ticket email error:", err.message);
  }
};

module.exports = sendTicketEmail;
