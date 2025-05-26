const mongoose = require("mongoose");

const subscriptionOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["Online Banking", "Cash on Delivery"],
      default: "Online Banking",
      required: true,
    },
    shippingAddress: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["unverified", "pending", "active", "cancelled"],
      default: "unverified",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionOrder", subscriptionOrderSchema);
