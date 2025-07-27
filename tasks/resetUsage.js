const Usage = require('../models/Usage');

async function resetMonthlyUsage() {
  const today = new Date();
  const day = today.getDate();

  // Only run on the 2nd of the month
  if (day !== 2) return;

  try {
    const allUsage = await Usage.find({});
    const resetPromises = allUsage.map(usage =>
      Usage.findByIdAndUpdate(usage._id, {
        count: 0,
        storage: 0,
        lastReset: new Date()
      })
    );
    await Promise.all(resetPromises);
    console.log("✅ Monthly usage reset completed.");
  } catch (error) {
    console.error("❌ Failed to reset monthly usage:", error.message);
  }
}

module.exports = resetMonthlyUsage;
