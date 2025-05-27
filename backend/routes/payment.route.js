// routes/payment.routes.js
const express = require("express");
const {
  generateVietQR,
  logPaymentStatus,
  verifyPayment,
  getMyPayments,
} = require("../controllers/payment.controller");
const subscriptionPaymentController = require("../controllers/subscriptionPayment.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/create", authMiddleware, generateVietQR);

router.post("/status/log", authMiddleware, logPaymentStatus);

router.get("/:paymentId/verify", authMiddleware, verifyPayment);

// New endpoint to list current user's payments
router.get("/my-payments", authMiddleware, getMyPayments);

router.post(
  "/subscription/create",
  authMiddleware,
  subscriptionPaymentController.generateSubscriptionVietQR
);
// New endpoint to list current user's subscription payments
router.get(
  "/my-subscription-payments",
  authMiddleware,
  subscriptionPaymentController.getMySubscriptionPayment
);

module.exports = router;
