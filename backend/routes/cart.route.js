const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Add item to cart
router.post("/add", authMiddleware, cartController.addToCart);

// Get cart
router.get("/", authMiddleware, cartController.getCart);

// Update cart item quantity
router.put("/update", authMiddleware, cartController.updateCartItem);

// Remove item from cart
router.delete(
  "/remove/:productId",
  authMiddleware,
  cartController.removeFromCart
);

// Clear cart
router.delete("/clear", authMiddleware, cartController.clearCart);

module.exports = router;
