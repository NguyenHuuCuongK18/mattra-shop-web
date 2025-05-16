const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Create category (admin only)
router.post("/create", authMiddleware, categoryController.createCategory);

// Get all categories (public)
router.get("/", categoryController.getAllCategories);

// Get category by ID (public)
router.get("/:id", categoryController.getCategoryById);

// Update category (admin only)
router.put("/update/:id", authMiddleware, categoryController.updateCategory);

// Delete category (admin only)
router.delete("/delete/:id", authMiddleware, categoryController.deleteCategory);

module.exports = router;
