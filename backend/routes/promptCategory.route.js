const express = require("express");
const router = express.Router();
const promptCategoryController = require("../controllers/promptCategory.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Create prompt category (admin only)
router.post(
  "/create",
  authMiddleware,
  promptCategoryController.createPromptCategory
);

// Get all prompt categories (admin only)
router.get(
  "/",
  authMiddleware,
  promptCategoryController.getAllPromptCategories
);

// Get prompt category by ID (admin only)
router.get(
  "/:id",
  authMiddleware,
  promptCategoryController.getPromptCategoryById
);

// Update prompt category (admin only)
router.put(
  "/update/:id",
  authMiddleware,
  promptCategoryController.updatePromptCategory
);

// Delete prompt category (admin only)
router.delete(
  "/delete/:id",
  authMiddleware,
  promptCategoryController.deletePromptCategory
);

module.exports = router;
