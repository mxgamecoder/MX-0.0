// routes/marketplace.js
const express = require('express');
const router = express.Router();
const MarketplaceAPI = require('../models/MarketplaceAPI');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const freeApis = require('../data/freeApis'); // ✅ Include free APIs

// Get user's owned APIs including free ones
router.get('/user/owned-apis/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const userOwned = user.ownedAPIs || [];

    // Convert freeApis to match the shape of ownedAPIs
    const freeOwned = freeApis.map(fp => {
      const [category, name] = fp.split('/');
      return {
        name,
        category,
        filePath: fp
      };
    });

    const combined = [...userOwned, ...freeOwned];

    res.json({ success: true, owned: combined });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET: Load APIs from local JSON file and inject _id if missing
router.get('/json', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../data/marketplace-data.json');
    const data = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(data);

    // Inject fake _id if not present
    const withId = parsed.map((api, index) => ({
      _id: api._id || `json_api_${index + 1}`,
      ...api
    }));

    res.json({ success: true, apis: withId });
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
    usageMessage,
    image
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
    image
  });

  await newApi.save();

  res.json({ success: true, message: 'API uploaded successfully to marketplace 🎉' });
});

// GET: All APIs from MongoDB
router.get('/all', async (req, res) => {
  const apis = await MarketplaceAPI.find({});
  res.json({ success: true, apis });
});

// POST: Buy an API
router.post('/buy', async (req, res) => {
  const { userId, apiId } = req.body;

  // ❌ Prevent buying static JSON APIs
  if (apiId.startsWith('json_api_')) {
    return res.status(400).json({ success: false, message: 'Static APIs cannot be purchased.' });
  }

  const api = await MarketplaceAPI.findById(apiId);
  const user = await User.findById(userId);

  if (!api || !user) return res.status(404).json({ success: false, message: 'User or API not found' });

  if (user.coins < api.price) {
    return res.status(400).json({ success: false, message: 'Not enough coins 💰' });
  }

  const alreadyOwned = user.ownedAPIs.some(entry => {
    if (typeof entry === 'string') return entry === api.filePath;
    return entry.name === api.name && entry.category === api.category;
  });

  if (alreadyOwned) {
    return res.status(400).json({ success: false, message: 'You already own this API' });
  }

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
