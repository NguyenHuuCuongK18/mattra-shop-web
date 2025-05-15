const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// User routes
// Register a new user
// Register also logs in the user
router.post("/register", userController.register);

// Login a user
router.post("/login", userController.login);

// Get user profile
// This route is protected by authMiddleware
router.get("/profile", authMiddleware, userController.getProfile);

// change user password
// This route is protected by authMiddleware
router.post("/change-password", authMiddleware, userController.changePassword);
// To be implemented
// router.post("/request-password-reset", userController.requestPasswordReset);
// router.post("/reset-password", userController.resetPassword);

// Update user profile
router.post("/update-info", authMiddleware, userController.updateUserInfo);

// Logout user
router.post("/logout", authMiddleware, userController.logout);
module.exports = router;
