// models/emailVerification.model.js
const mongoose = require("mongoose");

const emailVerificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    code: { type: String, required: true }, // bcrypt‐hashed code
    expireAt: { type: Date, required: true }, // when this document should expire
  },
  { timestamps: true }
);

// TTL index: automatically delete when expireAt is reached
emailVerificationSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("EmailVerification", emailVerificationSchema);
