// utils/templates.js

// Verification Email
const verificationEmail = (username, code) => `
<div style="font-family: Arial, sans-serif; color:#f1f1f1; background:#070607; line-height:1.6; padding:20px;">
  <div style="border:3px solid #9F7AEA; border-radius:8px; padding:20px;">
    <h2 style="color:#9F7AEA;">🚀 Welcome to Lumora ID, ${username}!</h2>
    <p>We are excited to have you on board. Your account has been created successfully 🎉.</p>
    <p><strong>Your Verification Code:</strong><br/>
       <span style="color:#00b894; font-size:1.5em; font-weight:bold;">${code}</span>
    </p>
    <p>Please enter this code in the app to verify your account and unlock all features.</p>
    <p>If you didn’t sign up, you can safely ignore this email ✅.</p>
    <p>Thank you for choosing Lumora ID 🙏</p>
  </div>
  <p style="font-size:0.9em; color:#bbb; margin-top:20px; text-align:center;">
    Lumora ID – Secure, fast & reliable account management 🌎 <br/>
    <span style="color:#9F7AEA;">Lumora × MΞKΛ Core</span>
  </p>
</div>
`;

// Password Reset Email (code-based)
const passwordResetEmail = (username, code) => `
<div style="font-family: Arial, sans-serif; color:#f1f1f1; background:#070607; line-height:1.6; padding:20px;">
  <div style="border:3px solid #9F7AEA; border-radius:8px; padding:20px;">
    <h2 style="color:#e17055;">🔐 Password Reset Request</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>We received a request to reset your Lumora ID password.</p>
    <p><strong>Your Reset Code:</strong><br/>
       <span style="color:#0984e3; font-size:1.5em; font-weight:bold;">${code}</span>
    </p>
    <p>Use this code in the app to continue resetting your password.</p>
    <p>If you did not request this reset, please ignore this email or secure your account immediately ⚠️.</p>
    <p>Your security is our priority 🔒</p>
  </div>
  <p style="font-size:0.9em; color:#bbb; margin-top:20px; text-align:center;">
    Lumora ID – Secure & trusted account management <br/>
    <span style="color:#9F7AEA;">Lumora × MΞKΛ Core</span>
  </p>
</div>
`;

// Password Reset Email (own password change for logged-in user)
const passwordResetEmailOwn = (username) => `
<div style="font-family: Arial, sans-serif; color:#f1f1f1; background:#070607; line-height:1.6; padding:20px;">
  <div style="border:3px solid #9F7AEA; border-radius:8px; padding:20px;">
    <h2 style="color:#e17055;">🔐 Lumora ID Password Updated</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>Your Lumora ID password was successfully updated ✅.</p>
    <p>If this action was not done by you, please reset your password immediately or contact support 🚨.</p>
    <p>Thank you for keeping your account safe 🔒</p>
  </div>
  <p style="font-size:0.9em; color:#bbb; margin-top:20px; text-align:center;">
    Lumora ID – Secure & trusted account management <br/>
    <span style="color:#9F7AEA;">Lumora × MΞKΛ Core</span>
  </p>
</div>
`;

// Login Alert Email
const loginAlertEmail = (username) => `
<div style="font-family: Arial, sans-serif; color:#f1f1f1; background:#070607; line-height:1.6; padding:20px;">
  <div style="border:3px solid #9F7AEA; border-radius:8px; padding:20px;">
    <h2 style="color:#fd79a8;">🔔 Login Alert</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>A login was detected on your Lumora ID account.</p>
    <p>If this was you, everything is fine 👍.</p>
    <p>If you did not log in, please reset your password immediately or contact support ⚠️.</p>
    <p>Your security always comes first 🔒</p>
  </div>
  <p style="font-size:0.9em; color:#bbb; margin-top:20px; text-align:center;">
    Lumora ID – Secure, fast & reliable account management 🌎 <br/>
    <span style="color:#9F7AEA;">Lumora × MΞKΛ Core</span>
  </p>
</div>
`;

module.exports = { verificationEmail, passwordResetEmail, passwordResetEmailOwn, loginAlertEmail };
