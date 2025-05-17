const mongoose = require("mongoose");

const promptCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    unique: true,
    trim: true,
    maxlength: [50, "Name cannot exceed 50 characters"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"],
  },
  type: {
    type: String,
    enum: {
      values: ["diet", "info", "other", "recipe"],
      message: "{VALUE} is not a valid type",
    },
    default: "other",
  },
  promptText: {
    type: String,
    required: [true, "Prompt text is required"],
    trim: true,
    maxlength: [200, "Prompt text cannot exceed 200 characters"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt on save
promptCategorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
promptCategorySchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model("PromptCategory", promptCategorySchema);
