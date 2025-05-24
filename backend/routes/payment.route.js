const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Create payment
router.post("/create", authMiddleware, paymentController.createPayment);

module.exports = router;
