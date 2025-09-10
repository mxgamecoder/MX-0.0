// utils/templates.js

// Verification Email
const verificationEmail = (username, code) => `
<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
  <h2 style="color: #6C5CE7;">🚀 Welcome to Lumora ID, ${username}!</h2>
  <p>We are thrilled to have you on board. Your account has been created successfully.</p>
  <p><strong>Your Verification Code:</strong> 
     <span style="color: #00b894; font-size: 1.5em; font-weight: bold;">${code}</span>
  </p>
  <p>If you didn't sign up, you can safely ignore this email.</p>
  <hr>
  <p style="font-size: 0.9em; color: #636e72;">Lumora ID – Secure, fast & reliable account management 🌎</p>
</div>
`;

// Password Reset Email (code-based)
const passwordResetEmail = (username, code) => `
<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
  <h2 style="color: #e17055;">🔐 Password Reset Request</h2>
  <p>Hello ${username},</p>
  <p>We received a request to reset your Lumora ID password.</p>
  <p><strong>Your Reset Code:</strong> 
     <span style="color: #0984e3; font-size: 1.5em; font-weight: bold;">${code}</span>
  </p>
  <p>If you didn't request this, please ignore this email or secure your account immediately.</p>
  <hr>
  <p style="font-size: 0.9em; color: #636e72;">Lumora ID – Secure & trusted account management</p>
</div>
`;

// Password Reset Email (own password change for logged-in user)
const passwordResetEmailOwn = (username) => `
<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
  <h2 style="color: #e17055;">🔐 Lumora ID Password Updated</h2>
  <p>Hello ${username},</p>
  <p>Your Lumora ID password was successfully updated.</p>
  <p>If this wasn’t you, please reset your password immediately or contact support.</p>
  <hr>
  <p style="font-size: 0.9em; color: #636e72;">Lumora ID – Secure & trusted account management</p>
</div>
`;

// Login Alert Email
const loginAlertEmail = (username) => `
<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
  <h2 style="color: #fd79a8;">🔔 Login Alert</h2>
  <p>Hello ${username},</p>
  <p>We noticed a login to your Lumora ID account.</p>
  <p>If this was you, everything is fine. If not, reset your password immediately!</p>
  <hr>
  <p style="font-size: 0.9em; color: #636e72;">Lumora ID – Secure, fast & reliable account management</p>
</div>
`;

module.exports = { verificationEmail, passwordResetEmail, passwordResetEmailOwn, loginAlertEmail };
