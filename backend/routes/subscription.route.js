const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscription.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Create subscription (admin only)
router.post(
  "/create",
  authMiddleware,
  subscriptionController.createSubscription
);

// Get all subscriptions
router.get("/", subscriptionController.getAllSubscriptions);

// Get subscription by ID
router.get("/:id", subscriptionController.getSubscriptionById);

// Update subscription (admin only)
router.put(
  "/update/:id",
  authMiddleware,
  subscriptionController.updateSubscription
);

// Delete subscription (admin only)
router.delete(
  "/delete/:id",
  authMiddleware,
  subscriptionController.deleteSubscription
);

module.exports = router;
