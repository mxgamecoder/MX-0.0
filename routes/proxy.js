const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_KEY = 'meka_3a38b73fb1034e1de0723afe'; // ✅ This must match your real working key
const BASE = 'https://mxgamecoder-klfx.onrender.com'; // 🔥 Change if you host somewhere else

router.get('/:endpoint/:category?', async (req, res) => {
  const { endpoint, category } = req.params;
  const url = category
    ? `${BASE}/${endpoint}/${category}?meka=${API_KEY}`
    : `${BASE}/${endpoint}?meka=${API_KEY}`;

  try {
    const response = await axios.get(url);
    res.json(response.data); // 💯 Send back JSON to frontend
  } catch (error) {
    console.error("🔴 Proxy error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: true,
      message: error.response?.data?.message || 'Proxy failed',
    });
  }
});

module.exports = router;
