const cron = require("node-cron");
const MarketplaceAPI = require("./models/MarketplaceAPI");

// 🏆 Reset Top every week (Sunday 00:00)
cron.schedule("0 0 * * 0", async () => {
  console.log("♻ Resetting Top ranks...");
  try {
    const apis = await MarketplaceAPI.find({});
    for (let api of apis) {
      api.rank = 0; // clear old rank
      await api.save();
    }
    console.log("✅ Top reset complete");
  } catch (err) {
    console.error("❌ Top reset failed:", err);
  }
});
