const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  avatar: { type: String },
  phone: { type: String, required: true },
  address: { type: String },
  role: {
    type: String,
    enum: ["user", "subscriber", "admin"],
    default: "user",
  },
  subscription: {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    status: { type: String, enum: ["active", "inactive"], default: "inactive" },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  vouchers: [
    {
      voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Voucher",
        required: true,
      },
      status: {
        type: String,
        enum: ["available", "used", "expired"],
        default: "available",
        required: true,
      },
    },
  ],
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

module.exports = mongoose.model("User", userSchema);
