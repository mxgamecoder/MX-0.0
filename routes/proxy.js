const express = require('express');
const router = express.Router();
const axios = require('axios');

const YOUR_API_KEY = 'meka_3a38b73fb1034e1de0723afe';
const BASE_URL = 'https://mxgamecoder-klfx.onrender.com';

router.get('/:type/:category?', async (req, res) => {
  const { type, category } = req.params;

  try {
    let endpoint = `${BASE_URL}/${type}`;
    if (category) endpoint += `/${category}`;
    endpoint += `?meka=${YOUR_API_KEY}`;

    const result = await axios.get(endpoint);
    res.json(result.data);
  } catch (err) {
    console.error("🔴 Proxy error:", err.message);
    res.status(500).json({ success: false, message: "Proxy failed." });
  }
});

module.exports = router;
