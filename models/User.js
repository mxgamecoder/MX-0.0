const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  dob: { type: Date, required: true },
  phone: { type: String },
  id2: { type: String, unique: true, required: true },
  publicUserId: { type: String, unique: true, required: true },
  isVerified: { type: Boolean, default: false },
  balance: { type: Number, default: 0 },
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
  ownedApis: [{
    name: String,
    category: String,
    filePath: String,
    purchasedAt: Date
  }],
  apiKeyRegens: { type: Number, default: 0 },
  plan: { type: String, default: 'free' },

  // VaultX-specific
  coins: { type: Number, default: 0 },
  vaultxPlan: { type: String, default: 'free' },  // ✅ added field

  requestCount: { type: Number, default: 0 },
  monthlyReset: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
