const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Create a new review
router.post("/create", authMiddleware, reviewController.createReview);
// Get all reviews for a product
router.get("/:productId", reviewController.getAllReviewsOfProduct);
// Update a review
router.put("/update/:reviewId", authMiddleware, reviewController.updateReview);
// Delete a review
router.delete(
  "/delete/:reviewId",
  authMiddleware,
  reviewController.deleteReview
);
module.exports = router;
