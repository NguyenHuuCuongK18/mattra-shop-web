const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  address: { type: String },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

module.exports = mongoose.model("User", userSchema);
