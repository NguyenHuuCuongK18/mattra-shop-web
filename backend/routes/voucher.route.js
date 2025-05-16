const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucher.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Create voucher (admin only)
router.post("/create", authMiddleware, voucherController.createVoucher);

// Assign voucher to user (admin only)
router.post("/assign", authMiddleware, voucherController.assignVoucher);

// Assign voucher to everyone (admin only)
router.post(
  "/assign-everyone",
  authMiddleware,
  voucherController.assignEveryone
);

// Assign voucher to subscribers (admin only)
router.post(
  "/assign-subscribers",
  authMiddleware,
  voucherController.assignSubscribers
);

// Claim voucher
router.post("/claim", authMiddleware, voucherController.claimVoucher);

// Get all vouchers
router.get("/", voucherController.getAllVouchers);

// Get voucher by ID
router.get("/:id", voucherController.getVoucherById);

// Get user-specific vouchers
router.get("/user", authMiddleware, voucherController.getUserVouchers);

// Update voucher (admin only)
router.put("/update/:id", authMiddleware, voucherController.updateVoucher);

// Delete voucher (admin only)
router.delete("/delete/:id", authMiddleware, voucherController.deleteVoucher);

module.exports = router;
