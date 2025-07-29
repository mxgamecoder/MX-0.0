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
    const user = await User.findOne({ publicUserId: userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const userOwned = user.ownedApis || [];

    // Load marketplace data from MongoDB
    const mongoApis = await MarketplaceAPI.find({}).lean();

    // Load static JSON APIs
    const jsonData = fs.readFileSync(path.join(__dirname, '../data/marketplace-data.json'), 'utf8');
    const staticApis = JSON.parse(jsonData);

    // Combine both sources
    const allApis = [...mongoApis, ...staticApis.map((api, i) => ({
      _id: `json_api_${i + 1}`,
      ...api
    }))];

    // Add metadata to each free API
    const freeOwned = freeApis.map(fp => {
      const [category, name] = fp.split('/');
      const filePath = `${category}/${name}`;

      const match = allApis.find(api =>
        api.name === name && api.category === category
      );

      return {
        name,
        category,
        filePath,
        description: match?.description || 'No description available.',
        image: match?.image || 'https://i.ibb.co/JjMphBCP/avatar.jpg',
      };
    });

    // Add metadata to each user-owned API
    const enrichedUserOwned = userOwned.map(api => {
      const filePath = api.filePath || `${api.category}/${api.name}`;

      const match = allApis.find(entry =>
        entry.name === api.name && entry.category === api.category
      );

      return {
        ...api,
        filePath,
        description: match?.description || 'No description available.',
        image: match?.image || 'https://i.ibb.co/JjMphBCP/avatar.jpg',
      };
    });

    // Final combined list
    const combined = [...enrichedUserOwned, ...freeOwned];

    res.json({ success: true, owned: combined });
  } catch (err) {
    console.error(err);
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

  const user = await User.findOne({ publicUserId: userId });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  let api;
  let isStatic = false;

  // Check if it's a static (JSON) API
  if (apiId.startsWith('json_api_')) {
    try {
      const filePath = path.join(__dirname, '../data/marketplace-data.json');
      const jsonData = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(jsonData);

      const index = parseInt(apiId.replace('json_api_', '')) - 1;
      if (parsed[index]) {
        api = parsed[index];
        api._id = apiId;
        isStatic = true;
      } else {
        return res.status(404).json({ success: false, message: 'API not found in JSON' });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Error reading static API' });
    }
  } else {
    api = await MarketplaceAPI.findById(apiId);
    if (!api) return res.status(404).json({ success: false, message: 'API not found' });
  }

  // Check coin balance
  if (user.coins < api.price) {
    return res.status(400).json({ success: false, message: 'Not enough coins 💰' });
  }

  // Prevent duplicate purchase
  const alreadyOwned = user.ownedApis.some(entry => {
    return entry.filePath === `${api.category}/${api.name}`;
  });

  if (alreadyOwned) {
    return res.status(400).json({ success: false, message: 'You already own this API' });
  }

  // Deduct coins
  user.coins -= api.price;

  // Add to owned APIs
  user.ownedApis.push({
    name: api.name,
    category: api.category,
    filePath: `${api.category}/${api.name}`,
    purchasedAt: new Date()
  });

  // Update available if it's from MongoDB
  if (!isStatic) {
    api.available -= 1;
    await api.save();
  }

  await user.save();

  res.json({ success: true, message: 'API purchased successfully 🎉' });
});

module.exports = router;
