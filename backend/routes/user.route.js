const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Register user
router.post("/register", userController.register);

// Login user
router.post("/login", userController.login);

// Get user profile
router.get("/profile", authMiddleware, userController.getProfile);

// Change password
router.put("/change-password", authMiddleware, userController.changePassword);

// Request password reset
router.post("/request-password-reset", userController.requestPasswordReset);

// Reset password
router.post("/reset-password", userController.resetPassword);

// Update user info
router.put("/update", authMiddleware, userController.updateUserInfo);

// Logout
router.post("/logout", authMiddleware, userController.logout);

// Get all users (admin only)
router.get("/", authMiddleware, userController.getAllUsers);

// Update subscription status (admin only)
router.put(
  "/:id/subscription",
  authMiddleware,
  userController.updateSubscriptionStatus
);

module.exports = router;
