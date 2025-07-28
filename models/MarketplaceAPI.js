// models/MarketplaceAPI.js
const mongoose = require('mongoose');

const MarketplaceAPISchema = new mongoose.Schema({
  name: String,
  category: String,
  description: String,
  createdBy: String,
  price: Number,
  duration: Number,
  available: Number,
  status: {
    type: String,
    default: 'active'
  },
  filePath: String,      // e.g. 'fun/joke'
  usageMessage: String,  // 🟢 How to use the API (manual message)
  image: String          // 🟢 Optional image URL
});

module.exports = mongoose.model('MarketplaceAPI', MarketplaceAPISchema);
