const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  discountApplied: { type: Number, default: 0 },
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
  paymentMethod: { type: String, required: true },
  status: { type: String, enum: ['pending', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  shippingAddress: { type: String, required: true }
});

module.exports = mongoose.model('Order', orderSchema);