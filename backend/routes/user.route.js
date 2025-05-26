const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Before registering, user must request (and receive) a code
router.post(
  "/request-email-verification",
  userController.requestEmailVerification
);

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

// Update user avatar
router.post("/update-avatar", authMiddleware, userController.updateAvatar);

// Delete a user (admin only)
router.delete("/delete/:id", authMiddleware, userController.deleteUser);

module.exports = router;
