const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  dob: { type: Date, required: true },
  phone: { type: String },
  id2: { type: String, unique: true, required: true }, // Hidden internal ID
  publicUserId: { type: String, unique: true, required: true }, // Safe public-facing ID
  isVerified: { type: Boolean, default: false },
  balance: { type: Number, default: 0 },
  apiKey: {
  type: String,
  unique: true,
  sparse: true // allows it to be null until they create one
  },
  apiKeyRegens: {
  type: Number,
  default: 0
  },
  plan: { type: String, default: 'Free' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
