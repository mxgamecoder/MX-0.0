const express = require('express');
const router = express.Router();
const Support = require('../models/Support');
const User = require('../models/User');
const auth = require('../middleware/auth'); // token-based middleware

// @route   POST /api/support/contact
// @desc    User sends support request
// @access  Private
router.post('/contact', auth, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, msg: 'Subject and message required.' });
    }

    const support = new Support({
      user: req.user.id,
      subject,
      message
    });

    await support.save();

    res.json({ success: true, msg: 'Support message sent!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

module.exports = router;
