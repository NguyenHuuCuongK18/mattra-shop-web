const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  image: { type: String },
  stock: { type: Number, required: true, min: 0 },
  categories: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  isFeatured: { type: Boolean, default: false },
});

module.exports = mongoose.model("Product", productSchema);
