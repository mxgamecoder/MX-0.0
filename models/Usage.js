const mongoose = require('mongoose');

const UsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  count: {
    type: Number,
    default: 0 // API requests made this month
  },
  storage: {
    type: Number,
    default: 0 // MB used this month
  },
  lastReset: {
    type: Date,
    default: Date.now // for monthly reset
  }
}, { timestamps: true });

module.exports = mongoose.model('Usage', UsageSchema);
