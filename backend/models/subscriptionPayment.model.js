const mongoose = require("mongoose");

const subscriptionPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionOrder",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentImgUrl: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    acqId: {
      type: String,
    },
    history: [
      {
        status: { type: String },
        data: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "SubscriptionPayment",
  subscriptionPaymentSchema
);
