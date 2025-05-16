const mongoose = require("mongoose");
const Product = require("./product.model");

const cartSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
});

// Validate productId exists before saving
cartSchema.pre("save", async function (next) {
  try {
    for (const item of this.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
      if (item.quantity > product.stock) {
        throw new Error(
          `Quantity ${item.quantity} exceeds stock for product ${product.name}`
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Cart", cartSchema);
