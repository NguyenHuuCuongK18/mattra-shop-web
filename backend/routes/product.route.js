const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Create product (admin only)
router.post("/create", authMiddleware, productController.createProduct);

// Get all products (public)
router.get("/", productController.getAllProducts);

// Get product by ID (public)
router.get("/:id", productController.getProductById);

// Update product (admin only)
router.put("/update/:id", authMiddleware, productController.updateProduct);

// Delete product (admin only)
router.delete("/delete/:id", authMiddleware, productController.deleteProduct);

module.exports = router;
