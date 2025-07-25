const mongoose = require('mongoose');

const verifyTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  code: { type: String, required: true },
  resendAttempts: { type: Number, default: 0 }, // NEW
  createdAt: { type: Date, default: Date.now, expires: 600 } // expires in 10 minutes
});

module.exports = mongoose.model('VerifyToken', verifyTokenSchema);
