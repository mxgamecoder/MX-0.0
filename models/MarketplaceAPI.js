// models/MarketplaceAPI.js
const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  userId: String,
  username: String,
  text: String,
  edited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const CommentSchema = new mongoose.Schema({
  userId: String,
  username: String,
  text: String,
  edited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  replies: [ReplySchema] // 👈 nested replies
});

const MarketplaceAPISchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: { type: String, required: true },  // internal ID the api id is here
  ownerUsername: { type: String, required: true }, // 👈 show in frontend
  price: { type: Number, required: true },
  duration: { type: mongoose.Schema.Types.Mixed, required: true },
  available: { type: mongoose.Schema.Types.Mixed, required: true },
  firstCommenter: { 
    userId: String, 
    username: String 
  },
  status: { type: String, default: "pending" },
  filePath: String,
  usageMessage: String,
  image: { type: String, required: true },

  files: [{ path: String, localPath: String }],  // 👈 store extracted files
  folderName: String,                            // 👈 extraction folder

  lastUpdated: { type: Date, default: Date.now },
  likes: [{ type: String }],
  dislikes: [{ type: String }],
  buyCount: { type: Number, default: 0 },   // total buys
  rank: { type: Number, default: 0 },        // for Top leaderboard
  comments: [CommentSchema]
}, { timestamps: true });

module.exports = mongoose.model('MarketplaceAPI', MarketplaceAPISchema);
