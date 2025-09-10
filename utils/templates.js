const verificationEmail = (username, code) => `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <h2 style="color: #6C5CE7;">🚀 Welcome to MXAPI, ${username}!</h2>
    <p>We are thrilled to have you on board. Your account has been created successfully.</p>
    <p><strong>Your Verification Code:</strong> <span style="color: #00b894; font-size: 1.4em;">${code}</span></p>
    <p>If you didn't sign up, you can safely ignore this email.</p>
    <hr>
    <p style="font-size: 0.9em; color: #636e72;">MXAPI – The fastest and most affordable API platform in the world 🌎</p>
  </div>
`;

const passwordResetEmail = (username, code) => `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <h2 style="color: #e17055;">🔐 Password Reset Request</h2>
    <p>Hello ${username},</p>
    <p>We received a request to reset your MXAPI password.</p>
    <p><strong>Your Reset Code:</strong> <span style="color: #0984e3; font-size: 1.4em;">${code}</span></p>
    <p>If you didn't request this, please ignore this email or secure your account immediately.</p>
    <hr>
    <p style="font-size: 0.9em; color: #636e72;">MXAPI – Secure & Fast APIs</p>
  </div>
`;

const loginAlertEmail = (username) => `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <h2 style="color: #fd79a8;">🔔 Login Alert</h2>
    <p>Hello ${username},</p>
    <p>We noticed a login to your MXAPI account.</p>
    <p>If this was you, everything is fine. If not, reset your password immediately!</p>
    <hr>
    <p style="font-size: 0.9em; color: #636e72;">MXAPI – 10x faster than any API in the market</p>
  </div>
`;

module.exports = { verificationEmail, passwordResetEmail, loginAlertEmail };
