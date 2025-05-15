const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  subscription_amount: { type: Number, required: true, min: 0 },
  discount_percentage: { type: Number, required: true, min: 0, max: 100 },
  max_discount: { type: Number, required: true, min: 0 },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);