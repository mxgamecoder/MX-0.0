// models/MarketplaceAPI.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  userId: String,
  username: String,
  text: String,
  edited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

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
  usageMessage: String,
  image: String,

  // ✅ New additions:
  lastUpdated: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  comments: [CommentSchema]
});

module.exports = mongoose.model('MarketplaceAPI', MarketplaceAPISchema);
