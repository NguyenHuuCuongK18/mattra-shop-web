const Review = require("../models/review.model");
const Product = require("../models/product.model");

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res
        .status(400)
        .json({ message: "Product ID, rating, and comment are required" });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      productId,
      userId: req.user.id,
    });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    const review = new Review({
      productId,
      userId: req.user.id,
      rating,
      comment,
      createdAt: new Date(),
    });

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate("userId", "username email")
      .populate("productId", "name");

    res.status(201).json({
      message: "Review created successfully",
      review: populatedReview,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllReviewsOfProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    let query = {};
    if (productId) {
      // Validate product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      query.productId = productId;
    }

    const reviews = await Review.find(query)
      .populate("userId", "username email name avatar")
      .populate("productId", "name")
      .select("-__v")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Reviews retrieved successfully",
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating && !comment) {
      return res.status(400).json({
        message: "At least one field (rating or comment) is required to update",
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only update your own reviews" });
    }

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate("userId", "username email")
      .populate("productId", "name");

    res.status(200).json({
      message: "Review updated successfully",
      review: populatedReview,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await review.deleteOne();

    res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
