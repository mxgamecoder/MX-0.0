const mongoose = require('mongoose');

const verifyTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // expires in 10 mins
});

module.exports = mongoose.model('VerifyToken', verifyTokenSchema);