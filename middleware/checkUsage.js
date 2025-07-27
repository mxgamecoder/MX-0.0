const fs = require('fs');
const path = require('path');
const Usage = require('../models/Usage');
const User = require('../models/User');

module.exports = async function checkUsage(req, res, next) {
  const apiKey = req.query.meka;
  if (!apiKey) {
    return res.status(400).json({ success: false, message: "API key missing" });
  }

  const user = await User.findOne({ apiKey });
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid API key" });
  }

  let usage = await Usage.findOne({ userId: user._id });
  if (!usage) {
    usage = new Usage({ userId: user._id });
  }

  // 💾 Count number of files in ../data to compute storage usage
  const dataPath = path.join(__dirname, '..', 'data');
  let fileCount = 0;

  try {
    const files = fs.readdirSync(dataPath);
    fileCount = files.length;
  } catch (err) {
    console.error("Error reading data folder:", err);
  }

  usage.storage = fileCount * 5; // 5MB per file

  await usage.save();
  next();
};
