const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    discount_percentage: { type: Number, required: true, min: 0, max: 100 },
    max_discount: { type: Number, required: true, min: 0 },
    is_used: { type: Boolean, default: false },
    subscriberOnly: { type: Boolean, default: false },
    expires_at: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Voucher", voucherSchema);
