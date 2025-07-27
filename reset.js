// reset.js
require('dotenv').config();
const mongoose = require('mongoose');
const Usage = require('../models/Usage');

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to DB for reset");
}

async function resetUsage() {
  const today = new Date();
  const day = today.getDate();

  if (day !== 2) {
    console.log("⏭️ Not the 2nd — skipping reset.");
    return;
  }

  try {
    const allUsage = await Usage.find({});
    const resetOps = allUsage.map(entry => Usage.findByIdAndUpdate(entry._id, {
      count: 0,
      storage: 0,
      lastReset: new Date()
    }));

    await Promise.all(resetOps);
    console.log("✅ Usage reset for all users.");
  } catch (err) {
    console.error("❌ Reset failed:", err.message);
  }
}

(async () => {
  await connectDB();
  await resetUsage();
  mongoose.disconnect(); // close DB connection
})();
