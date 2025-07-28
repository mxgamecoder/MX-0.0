// routes/marketplace.js
const express = require('express');
const router = express.Router();
const MarketplaceAPI = require('../models/MarketplaceAPI');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

router.get('/user/owned-apis/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, owned: user.ownedAPIs || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET: Load APIs from local JSON file
router.get('/json', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../data/marketplace-data.json');
    const data = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(data);
    res.json({ success: true, apis: parsed });
  } catch (err) {
    console.error('[MARKETPLACE JSON ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to load marketplace APIs from JSON' });
  }
});

// POST: Upload a new API to marketplace
router.post('/upload', async (req, res) => {
  const {
    name,
    category,
    description,
    createdBy,
    price,
    duration,
    available,
    usageMessage,  // 👈 Already handled
    image          // ✅ Add this line
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
    usageMessage,
    image // ✅ Save the image into DB
  });

  await newApi.save();

  res.json({ success: true, message: 'API uploaded successfully to marketplace 🎉' });
});

router.get('/all', async (req, res) => {
  const apis = await MarketplaceAPI.find({});
  res.json({ success: true, apis });
});

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
