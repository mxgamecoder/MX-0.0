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
  filePath: String,
  usageMessage: String // 👈 New field to explain how to use the API
});

module.exports = mongoose.model('MarketplaceAPI', MarketplaceAPISchema);
