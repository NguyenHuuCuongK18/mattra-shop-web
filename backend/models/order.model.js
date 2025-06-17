const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    phone: { type: String, required: true },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    discountApplied: { type: Number, default: 0 },
    voucherId: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher" },
    paymentMethod: {
      type: String,
      enum: ["Online Banking", "Cash on Delivery"],
      default: "Online Banking",
      required: true,
    },
    status: {
      type: String,
      enum: ["unverified", "pending", "shipping", "delivered", "cancelled"],
      default: "unverified",
    },
    shippingAddress: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
