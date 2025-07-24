const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const VerifyToken = require('../models/VerifyToken');
const generateCode = require('../utils/generateCode');
const sendEmail = require('../utils/sendEmail');

router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('username').notEmpty(),
  body('name').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, username, email, password, phone, dob } = req.body;

  try {
    const emailInUse = await User.findOne({ email });
    if (emailInUse) return res.status(400).json({ msg: 'Email is already in use' });

    const usernameInUse = await User.findOne({ username });
    if (usernameInUse) return res.status(400).json({ msg: 'Username is already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, username, email, password: hashed, phone, dob });
    await user.save();

    const code = generateCode();
    await VerifyToken.deleteMany({ userId: user._id }); // Remove any old code
    await new VerifyToken({ userId: user._id, code }).save();
await sendEmail(email, 'Your MXAPI verification code', `Your code is: ${code}`);
    console.log(`📨 Email verification code for ${email}: ${code}`);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ msg: 'Registered successfully. Check email for code.', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/login', [
  body('identifier').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { identifier, password } = req.body;

  try {
    // Match by email or username
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!user) return res.status(400).json({ msg: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: 'Invalid password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ msg: 'Login successful', token, user: { name: user.name, username: user.username, email: user.email } });
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

  if (!user) return res.status(404).json({ msg: 'User not found' });

  const code = generateCode();
  await VerifyToken.deleteMany({ userId: user._id });

  const token = new VerifyToken({ userId: user._id, code });
  await token.save();

  // TODO: Send via email in future
  await sendEmail(email, 'Your MXAPI verification code', `Your code is: ${code}`);
  console.log(`🔐 Reset code for ${identifier}: ${code}`);

  res.json({ msg: 'Password reset code sent to your email or phone (demo)' });
});

router.post('/reset-password', async (req, res) => {
  const { identifier, code, newPassword } = req.body;

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }]
  });

  if (!user) return res.status(404).json({ msg: 'User not found' });

  const token = await VerifyToken.findOne({ userId: user._id, code });
  if (!token) return res.status(400).json({ msg: 'Invalid or expired code' });

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();
  await VerifyToken.deleteMany({ userId: user._id });

  res.json({ msg: 'Password reset successful. You can now log in.' });
});

router.post('/send-code', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: 'User not found' });

  if (user.isVerified) return res.status(400).json({ msg: 'User already verified' });

  const code = generateCode();

  // Remove old tokens
  await VerifyToken.deleteMany({ userId: user._id });

  const token = new VerifyToken({ userId: user._id, code });
  await token.save();

  // TODO: Send `code` via email (can use nodemailer later)
  await sendEmail(email, 'Your MXAPI verification code', `Your code is: ${code}`);
  console.log(`📨 Verification code for ${email}: ${code}`);

  res.json({ msg: 'Verification code sent to email' });
});

module.exports = router;
