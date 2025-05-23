// controllers/product.controller.js

const Product = require("../models/product.model"); // your Product schema (includes isFeatured) :contentReference[oaicite:0]{index=0}
const { put } = require("@vercel/blob");
const multer = require("multer");
const path = require("path");

// Multer setup for single “image” upload (max 5MB, JPEG/PNG only)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPEG and PNG files are allowed"));
    }
    cb(null, true);
  },
}).single("image");

// Create a new product (admin only)
exports.createProduct = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      let { name, description, price, stock, category, isFeatured } = req.body;
      // checkbox comes in as string
      const featuredFlag = isFeatured === "true" || isFeatured === true;

      // Basic validation
      if (!name || price == null || stock == null) {
        return res
          .status(400)
          .json({ message: "Name, price, and stock are required" });
      }
      if (price < 0 || stock < 0) {
        return res
          .status(400)
          .json({ message: "Price and stock must be non-negative" });
      }

      // Upload image to Vercel Blob (optional)
      let imageUrl;
      if (req.file) {
        const filename = `products/${req.user.id}_${Date.now()}${path.extname(
          req.file.originalname
        )}`;
        const blob = await put(filename, req.file.buffer, {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        imageUrl = blob.url;
      }

      // Persist product (note schema’s field is “categories”)
      const product = new Product({
        name,
        description,
        price,
        stock,
        categories: category,
        image: imageUrl,
        isFeatured: featuredFlag,
      });

      await product.save();
      res.status(201).json({
        message: "Product created successfully",
        product: {
          id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.categories,
          imageUrl: product.image,
          isFeatured: product.isFeatured,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("categories", "name")
      .select("-__v");
    res
      .status(200)
      .json({ message: "Products retrieved successfully", products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get one product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("categories", "name")
      .select("-__v");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res
      .status(200)
      .json({ message: "Product retrieved successfully", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a product (admin only; image & isFeatured optional)
exports.updateProduct = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      let { name, description, price, stock, category, isFeatured } = req.body;
      const featuredFlag = isFeatured === "true" || isFeatured === true;

      // Validate numeric fields if provided
      if (price != null && price < 0) {
        return res.status(400).json({ message: "Price must be non-negative" });
      }
      if (stock != null && stock < 0) {
        return res.status(400).json({ message: "Stock must be non-negative" });
      }

      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // New image?
      if (req.file) {
        const filename = `products/${req.user.id}_${Date.now()}${path.extname(
          req.file.originalname
        )}`;
        const blob = await put(filename, req.file.buffer, {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        product.image = blob.url;
      }

      // Update fields if present
      if (name) product.name = name;
      if (description) product.description = description;
      if (price != null) product.price = price;
      if (stock != null) product.stock = stock;
      if (category) product.categories = category;
      product.isFeatured = featuredFlag;
      product.updatedAt = Date.now();

      await product.save();
      res.status(200).json({
        message: "Product updated successfully",
        product: {
          id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.categories,
          imageUrl: product.image,
          isFeatured: product.isFeatured,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
};

// Delete a product (admin only)
exports.deleteProduct = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
