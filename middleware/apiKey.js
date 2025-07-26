// middleware/apiKey.js
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const apiKey = req.query.meka;

  if (!apiKey || !apiKey.startsWith('meka_')) {
    return res.status(401).json({
      success: false,
      msg: 'Missing or invalid API key. Append ?meka=your_api_key to use this endpoint.'
    });
  }

  const user = await User.findOne({ apiKey });
  if (!user) {
    return res.status(403).json({
      success: false,
      msg: 'Unauthorized. API key not found or invalid.'
    });
  }

  req.user = user;
  next();
};
