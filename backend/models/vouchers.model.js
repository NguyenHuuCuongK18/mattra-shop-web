const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  discount_percentage: { type: Number, required: true, min: 0, max: 100 },
  max_discount: { type: Number, required: true, min: 0 },
  is_used: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  expires_at: { type: Date }
});

module.exports = mongoose.model('Voucher', voucherSchema);