// routes/payment.routes.js
const express = require("express");
const {
  generateVietQR,
  logPaymentStatus,
  verifyPayment,
} = require("../controllers/payment.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/create", authMiddleware, generateVietQR);
router.post("/status/log", authMiddleware, logPaymentStatus);
router.get("/:paymentId/verify", authMiddleware, verifyPayment);

module.exports = router;
