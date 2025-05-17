const express = require("express");
const router = express.Router();
const geminiAIController = require("../controllers/geminiAI.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Generate default AI response (user prompt only)
router.post(
  "/generate/default",
  authMiddleware,
  geminiAIController.generateDefaultResponse
);

// Generate combined AI response (prompt category + user prompt)
router.post(
  "/generate/combined",
  authMiddleware,
  geminiAIController.generateCombinedResponse
);

module.exports = router;
