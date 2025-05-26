const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const subOrderCtrl = require("../controllers/subscriptionOrder.controller");

// Create a new subscription order
router.post("/create", authMiddleware, subOrderCtrl.createSubscriptionOrder);

// Get my subscription orders
router.get(
  "/my-orders",
  authMiddleware,
  subOrderCtrl.getUserSubscriptionOrders
);

// Get one by ID (owner or admin)
router.get("/:id", authMiddleware, subOrderCtrl.getSubscriptionOrderById);

// Admin: list all
router.get("/", authMiddleware, subOrderCtrl.getAllSubscriptionOrders);

// Admin: update status
router.put(
  "/update/:id",
  authMiddleware,
  subOrderCtrl.updateSubscriptionOrderStatus
);

// User: cancel
router.delete(
  "/cancel/:id",
  authMiddleware,
  subOrderCtrl.cancelSubscriptionOrder
);

module.exports = router;
