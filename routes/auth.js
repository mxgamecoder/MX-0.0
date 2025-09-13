const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { sedEmail, planEmailTemplate } = require("../utils/VaultX");
const User = require('../models/User');
const VerifyToken = require('../models/VerifyToken');
const generateCode = require('../utils/generateCode');
const sendEmail = require('../utils/sendEmail');
const meka = require('../middleware/auth');
const authenticate = require("../middleware/auth"); // JWT middleware to protect route
const plans = require("./plan");
const { verificationEmail, passwordResetEmail, loginAlertEmail, passwordResetEmailOwn } = require('../utils/templates');
const VaultX = require("vaultx-sdk");

const vaultx = new VaultX({
  publicUserId: process.env.VAULTX_PUBLIC_USERID, // e.g. mxapi_xsot4s1w
  folder: process.env.VAULTX_FOLDER,              // e.g. profile-images
});

// POST /auth/upload-avatar
router.post("/upload-avatar", authenticate, async (req, res) => {
  try {
    if (!req.files || !req.files.avatar) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const file = req.files.avatar;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 🗑️ Delete old avatar if exists (use filename, not UUID)
    if (user.avatarUrl) {
      try {
        const parts = user.avatarUrl.split("/");
        const oldFileName = parts[parts.length - 1]; // e.g. avatar(3).png
        await vaultx.delete(process.env.VAULTX_FOLDER, [oldFileName]);
        console.log("Old avatar deleted:", oldFileName);
      } catch (err) {
        console.warn("⚠️ Failed to delete old avatar:", err.message);
      }
    }

    // ✅ Upload new avatar
    const result = await vaultx.upload(
      process.env.VAULTX_FOLDER,
      file.data,
      { filename: file.name, contentType: file.mimetype }
    );

    // ✅ Update DB with new avatar URL
    user.avatarUrl = result.file.fileUrl; // SDK response always has fileUrl
    await user.save();

    res.json({
      msg: "✅ Avatar uploaded successfully",
      fileUrl: result.file.fileUrl,
      user: { avatarUrl: user.avatarUrl }
    });

  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ msg: "❌ Upload failed" });
  }
});

// PATCH /auth/update-profile
router.patch("/update-profile", [
  body('name').optional().matches(/^[A-Za-z\s]+$/).withMessage('Name must contain only letters'),
  body('username').optional().isLength({ max: 33 }).withMessage('Username must not be more than 33 characters'),
  body('password').optional().isLength({ min: 10 }).withMessage('Password must be at least 10 characters long'),
  body('dob').optional().custom((value) => {
    const dob = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 12) throw new Error('You must be at least 12 years old');
    return true;
  }),
  body('email').optional().isEmail().custom((value) => {
  const allowedDomains = ['@gmail.com', '@yahoo.com', '@outlook.com'];
  if (!allowedDomains.some(domain => value.endsWith(domain))) {
    throw new Error('Email must be Gmail, Yahoo, or Outlook');
  }
  return true;
}),
  body('phone').optional({ checkFalsy: true }).matches(/^\+?\d{7,15}$/).withMessage('Phone must be valid (with or without +), 7–15 digits')
], authenticate, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.user.id;
  const updates = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 🚫 Prevent editing sensitive fields
    delete updates.verified;
    delete updates.plan;
    delete updates.balance;

    // ✅ Password handling
    if (updates.password) {
      const isSame = await bcrypt.compare(updates.password, user.password);
      if (isSame) {
        return res.status(400).json({ msg: "❌ New password cannot be same as old password" });
      }
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    );

    res.json({
      message: "✅ Profile updated successfully.",
      user: updatedUser
    });
  } catch (err) {
    console.error("Profile update failed:", err);
    res.status(500).json({ message: "❌ Failed to update profile." });
  }
});

// check username
router.get('/check-username/:username', async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  res.json({ available: !user });
});

// check email
router.get('/check-email/:email', async (req, res) => {
  const user = await User.findOne({ email: req.params.email });
  res.json({ available: !user });
});

// check phone
router.get('/check-phone/:phone', async (req, res) => {
  const user = await User.findOne({ phone: req.params.phone });
  res.json({ available: !user });
});

router.get("/public-user/:publicId", async (req, res) => {
  try {
    const user = await User.findOne({ publicUserId: req.params.publicId })
      .select("username publicUserId vaultxPlan coins vaultxPlanExpire lastNotifiedDays email");

    if (!user) return res.status(404).json({ msg: "User not found" });

    let daysRemaining = null;

    if (user.vaultxPlanExpire) {
      const diff = user.vaultxPlanExpire - new Date();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // ✅ send expiry warnings (5, 3, 1 days left)
    if ([5, 3, 1].includes(daysRemaining) && user.lastNotifiedDays !== daysRemaining) {
      await sedEmail(
        user.email,
        `VaultX Plan Expiry – ${daysRemaining} days left ⏳`,
        planEmailTemplate({
          username: user.username,
          plan: user.vaultxPlan || "free",
          daysRemaining,
          type: "expiry-warning"
        })
      );
      user.lastNotifiedDays = daysRemaining;
      await user.save();
    }

    // ✅ handle expiration + downgrade
    if (daysRemaining !== null && daysRemaining <= 0 && user.vaultxPlan !== "free") {
      await sedEmail(
        user.email,
        "VaultX Plan Expired ❌",
        planEmailTemplate({
          username: user.username,
          plan: user.vaultxPlan,
          daysRemaining: 0,
          type: "expired"
        })
      );

      user.vaultxPlan = "free";
      user.vaultxPlanExpire = null;
      user.lastNotifiedDays = null;
      await user.save();
    }

    res.json({
      user: {
        publicUserId: user.publicUserId,
        username: user.username,
        coins: user.coins,
        vaultxPlan: user.vaultxPlan,
        vaultxPlanExpire: user.vaultxPlanExpire,
        daysRemaining
      }
    });
  } catch (err) {
    console.error("Public user fetch failed:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// REGISTER
router.post('/register', [
  body('name').matches(/^[A-Za-z\s]+$/).withMessage('Name must contain only letters'),
  body('username').isLength({ max: 33 }).withMessage('Username must not be more than 33 characters'),
  body('email').isEmail().custom((value) => {
    const allowedDomains = ['@gmail.com', '@yahoo.com', '@outlook.com'];
    if (!allowedDomains.some(domain => value.endsWith(domain))) {
      throw new Error('Email must be Gmail, Yahoo, or Outlook');
    }
    return true;
  }),
  body('password').isLength({ min: 10 }).withMessage('Password must be at least 10 characters long'),
  body('dob').notEmpty().withMessage('Date of birth is required').custom((value) => {
    const dob = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 12) throw new Error('You must be at least 12 years old');
    return true;
  }),
  body('phone').optional({ checkFalsy: true }).matches(/^\+?\d{7,15}$/).withMessage('Phone must be a valid number (with or without +), 7–15 digits')
], async (req, res) => {
  const { name, username, email, password, phone, dob } = req.body;

  try {
    const emailInUse = await User.findOne({ email });
    if (emailInUse) return res.status(400).json({ msg: 'Email is already in use' });

    const usernameInUse = await User.findOne({ username });
    if (usernameInUse) return res.status(400).json({ msg: 'Username is already in use' });

    const hashed = await bcrypt.hash(password, 10);

    const id2 = crypto.randomBytes(16).toString('hex'); // hidden internal ID
    const publicUserId = `mxapi_${Math.random().toString(36).substring(2, 10)}`; // public ID

    const user = new User({
      name,
      username,
      email,
      password: hashed,
      phone,
      dob,
      id2,
      publicUserId,
      plan: "free",
      coins: plans.free.coins,
      requestCount: 0
    });

    await user.save();

    const code = generateCode();
    await VerifyToken.deleteMany({ userId: user._id });
    await new VerifyToken({ userId: user._id, code }).save();

   // await sendEmail(email, 'Your MXAPI verification code', `Your code is: ${code}`);
await sendEmail({
  to: user.email,
  subject: 'Lumora ID Account Created 🎉',
  html: verificationEmail(user.username, code)
});
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      msg: 'Registered successfully. Check email for code.',
      token,
      user: {
        username: user.username,
        email: user.email,
        publicUserId: user.publicUserId
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// LOGIN
router.post('/login', [
  body('identifier').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

    if (!user) return res.status(400).json({ msg: 'User not found' });

    // ❌ Block login if not verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        msg: 'Account not verified' 
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: 'Invalid password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    await sendEmail({
  to: user.email,
  subject: 'Lumora ID Login Alert 🔐',
  html: loginAlertEmail(user.username)
});
    res.json({
      msg: 'Login successful',
      token,
      user: {
        username: user.username,
        email: user.email,
        publicUserId: user.publicUserId
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/user/:publicId', meka, async (req, res) => {
  try {
    const user = await User.findOne({ publicUserId: req.params.publicId }).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // 🔹 Auto-downgrade if expired
    if (user.planExpiresAt && new Date() > user.planExpiresAt) {
      user.vaultxPlan = "free";
      user.planExpiresAt = null;
      await user.save();
    }

    const daysRemaining = user.planExpiresAt
      ? Math.ceil((user.planExpiresAt - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    res.json({
      user: {
        username: user.username,
        name: user.name,
        email: user.email,
        balance: user.balance || 0,
        coins: user.coins || 0,
        dob: user.dob,
        phone: user.phone,
        isVerified: user.isVerified,
        plan: user.plan || 'Free',
        vaultxPlan: user.vaultxPlan || 'free',
        publicUserId: user.publicUserId,
        planExpiresAt: user.planExpiresAt,
        createdAt: user.createdAt, 
        daysRemaining,
        avatarUrl: user.avatarUrl || ""
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: 'User not found' });

  const token = await VerifyToken.findOne({ userId: user._id, code });
  if (!token) return res.status(400).json({ msg: 'Invalid or expired code' });

  user.isVerified = true;
  await user.save();
  await VerifyToken.deleteMany({ userId: user._id });

  res.json({ msg: 'Email verified successfully' });
});

router.post('/request-reset', async (req, res) => {
  const { identifier } = req.body;
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }]
  });

  // 🚨 Only allow verified users
  if (!user || !user.isVerified) {
    return res.status(404).json({ msg: 'User not found' });
  }

  const code = generateCode();
  await VerifyToken.deleteMany({ userId: user._id });

  const token = new VerifyToken({ userId: user._id, code });
  await token.save();

  await sendEmail({
  to: user.email,
  subject: 'Lumora ID Password Reset 🔐',
  html: passwordResetEmail(user.username, code)
});
  res.json({ msg: 'Password reset code sent to your email' });
});

router.post('/reset-password', async (req, res) => {
  const { identifier, code, newPassword } = req.body;

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }]
  });

  // 🚨 Block if not found or not verified
  if (!user || !user.isVerified) {
    return res.status(404).json({ msg: 'User not found' });
  }

  const token = await VerifyToken.findOne({ userId: user._id, code });
  if (!token) return res.status(400).json({ msg: 'Invalid or expired code' });

  // Prevent same password reuse
  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    return res.status(400).json({ msg: 'New password cannot be the same as your old password' });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();
  await VerifyToken.deleteMany({ userId: user._id });

  res.json({ msg: 'Password reset successful. You can now log in.' });

  await sendEmail({
  to: user.email,
  subject: 'Lumora ID Password Updated 🔐',
  html: passwordResetEmailOwn(user.username)
});
});

// POST /auth/send-code
router.post('/send-code', async (req, res) => {
  const { publicUserId, email } = req.body;

  let user;
  if (publicUserId) {
    user = await User.findOne({ publicUserId });
  } else if (email) {
    user = await User.findOne({ email });
  }

  if (!user) return res.status(404).json({ msg: 'User not found' });
  if (user.isVerified) return res.status(400).json({ msg: 'User already verified' });

  let existing = await VerifyToken.findOne({ userId: user._id });
  const code = generateCode();

  await VerifyToken.deleteMany({ userId: user._id });

  const token = new VerifyToken({
    userId: user._id,
    code,
    resendAttempts: existing ? existing.resendAttempts + 1 : 1
  });

  await token.save();
  
  // Make sure to send to the correct email
    await sendEmail({
  to: user.email,
  subject: 'Lumora ID Verification Code 🔑',
  html: verificationEmail(user.username, code)
});
  res.json({ msg: 'Verification code sent to email' });
});

// check password (new vs old)
router.post("/check-password", authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ msg: "Password required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isSame = await bcrypt.compare(password, user.password);
    if (isSame) {
      return res.json({ available: false, msg: "❌ New password cannot be same as old one" });
    }

    res.json({ available: true });
  } catch (err) {
    console.error("Password check failed:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Send code before sensitive update
router.post("/send-update-code", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const code = generateCode(); // 6-digit OTP
const token = new VerifyToken({
  userId: user._id,
  code,          // ✅ correct key
  purpose: "update"
});
    await token.save();
    await sendEmail({
  to: user.email,
  subject: 'Lumora ID Profile Update Verification 🔐',
  html: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #6C5CE7;">🔑 Confirm Your Profile Update, ${user.username}</h2>
        <p>Use the code below to confirm your profile changes:</p>
        <p><strong style="color:#00b894; font-size:1.5em; font-weight:bold;">${code}</strong></p>
        <p>If you didn’t request this, ignore this email.</p>
        <hr>
        <p style="font-size:0.9em; color:#636e72;">Lumora ID – Secure & trusted account management</p>
      </div>`
});
    res.json({ msg: "✅ Code sent to your email." });
  } catch (err) {
    console.error("Send update code error:", err);
    res.status(500).json({ msg: "Server error sending code." });
  }
});

// Verify code before applying update
router.post("/verify-update-code", authenticate, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ msg: "Code is required" });

  try {
    const record = await VerifyToken.findOne({
  userId: req.user.id,
  code,             // ✅ match on "code"
  purpose: "update"
});
    if (!record) return res.status(400).json({ msg: "❌ Invalid or expired code" });

    // delete after use
    await VerifyToken.findByIdAndDelete(record._id);

    res.json({ msg: "✅ Code verified. You may now update profile." });
  } catch (err) {
    console.error("Verify update code error:", err);
    res.status(500).json({ msg: "Server error verifying code." });
  }
});

// LOGIN for UNVERIFIED ACCOUNTS (trigger code if correct)
router.post('/unverified-login', [
  body('identifier').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) 
    return res.status(400).json({ errors: errors.array() });

  const { identifier, password } = req.body;

  try {
    // 🔎 Find by email or username
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { username: identifier }] 
    });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 🔑 Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid password" });

    // ✅ If already verified, don't send code
    if (user.isVerified) {
      return res.status(200).json({ 
        msg: "Account already verified. Please log in normally." 
      });
    }

    // 🚀 Generate new verification code
    const code = generateCode();
    await VerifyToken.deleteMany({ userId: user._id });

    const token = new VerifyToken({ userId: user._id, code });
    await token.save();

    // 📧 Send code via email
    await sendEmail(
      user.email,
      "Lumora ID Verification Code 🔑",
      verificationEmail(user.username, code)
    );

    return res.status(200).json({
      msg: "Account not verified. A verification code has been sent.",
      email: user.email
    });

  } catch (err) {
    console.error("Unverified login failed:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
