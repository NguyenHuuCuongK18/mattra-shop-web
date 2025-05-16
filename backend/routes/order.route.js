const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Create order
router.post("/create", authMiddleware, orderController.createOrder);

// Get user's orders
router.get("/my-orders", authMiddleware, orderController.getUserOrders);

// Get all orders (admin only)
router.get("/", authMiddleware, orderController.getAllOrders);

// Update order status (admin only)
router.put("/update/:id", authMiddleware, orderController.updateOrderStatus);

// Cancel order (user, unverified only)
router.delete("/cancel/:id", authMiddleware, orderController.cancelUserOrder);

// Confirm delivery (user)
router.post(
  "/confirm-delivery/:id",
  authMiddleware,
  orderController.confirmDelivery
);

module.exports = router;
