const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "Premium Monthly"
  price: { type: Number, required: true, min: 0 }, // Monthly price in USD
  duration: { type: Number, required: true, min: 1 }, // Duration in months
  description: { type: String },
  perks: [{ type: String }], // List of perks or features
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
