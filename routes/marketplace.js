// routes/marketplace.js
const express = require('express');
const router = express.Router();
const MarketplaceAPI = require('../models/MarketplaceAPI');

// POST: Upload a new API to marketplace
// POST: Upload a new API to marketplace
router.post('/upload', async (req, res) => {
  const {
    name, category, description,
    createdBy, price, duration, available,
    usageMessage // 👈 Receive from frontend
  } = req.body;

  const newApi = new MarketplaceAPI({
    name,
    category,
    description,
    createdBy,
    price,
    duration,
    available,
    filePath: `${category}/${name}`,
    usageMessage // 👈 Save it
  });

  await newApi.save();

  res.json({ success: true, message: 'API uploaded successfully to marketplace 🎉' });
});

router.get('/all', async (req, res) => {
  const apis = await MarketplaceAPI.find({});
  res.json({ success: true, apis });
});

// routes/marketplace.js continued
const User = require('../models/User');

router.post('/buy', async (req, res) => {
  const { userId, apiId } = req.body;

  const api = await MarketplaceAPI.findById(apiId);
  const user = await User.findById(userId);

  if (!api || !user) return res.status(404).json({ success: false, message: 'User or API not found' });

  if (user.coins < api.price) {
    return res.status(400).json({ success: false, message: 'Not enough coins 💰' });
  }

  // Check if already owned
  const alreadyOwned = user.ownedAPIs.find(owned =>
    owned.name === api.name && owned.category === api.category
  );
  if (alreadyOwned) {
    return res.status(400).json({ success: false, message: 'You already own this API' });
  }

  // Update both records
  user.coins -= api.price;
  user.ownedAPIs.push({
    name: api.name,
    category: api.category,
    filePath: api.filePath,
    purchasedAt: new Date()
  });
  api.available -= 1;

  await user.save();
  await api.save();

  res.json({ success: true, message: 'API purchased successfully 🎉' });
});

module.exports = router;
