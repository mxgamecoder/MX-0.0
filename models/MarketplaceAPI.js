// models/MarketplaceAPI.js
const mongoose = require('mongoose');

const MarketplaceAPISchema = new mongoose.Schema({
  name: String, // e.g. 'chatgpt'
  category: String, // e.g. 'catch'
  description: String, // "AI created to make you feel emotional"
  createdBy: String, // e.g. "MX-GΔMΞCØDΞR"
  price: Number, // in coins
  duration: Number, // in days (can ignore since you're doing permanent)
  available: Number, // how many slots left (decrease on purchase)
  status: {
    type: String,
    default: 'active'
  },
  filePath: String // optional, e.g. 'catch/chatgpt'
});

module.exports = mongoose.model('MarketplaceAPI', MarketplaceAPISchema);
