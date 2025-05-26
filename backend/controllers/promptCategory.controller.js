const PromptCategory = require("../models/promptCategory.model");

// Create a new prompt category (admin only)
exports.createPromptCategory = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { name, description, type, promptText } = req.body;
    if (!name || !promptText) {
      return res
        .status(400)
        .json({ message: "Name and prompt text are required" });
    }

    const existingCategory = await PromptCategory.findOne({ name });
    if (existingCategory) {
      return res
        .status(400)
        .json({ message: "Prompt category name already exists" });
    }

    const promptCategory = new PromptCategory({
      name,
      description,
      type,
      promptText,
    });

    await promptCategory.save();

    res.status(201).json({
      message: "Prompt category created successfully",
      promptCategory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all prompt categories
exports.getAllPromptCategories = async (req, res) => {
  try {
    const promptCategories = await PromptCategory.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      message: "Prompt categories retrieved successfully",
      promptCategories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get prompt category by ID
exports.getPromptCategoryById = async (req, res) => {
  try {
    const promptCategory = await PromptCategory.findById(req.params.id).select(
      "-__v"
    );
    if (!promptCategory) {
      return res.status(404).json({ message: "Prompt category not found" });
    }

    res.status(200).json({
      message: "Prompt category retrieved successfully",
      promptCategory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a prompt category (admin only)
exports.updatePromptCategory = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { name, description, type, promptText } = req.body;
    if (!name || !promptText) {
      return res
        .status(400)
        .json({ message: "Name and prompt text are required" });
    }

    const existingCategory = await PromptCategory.findOne({
      name,
      _id: { $ne: req.params.id },
    });
    if (existingCategory) {
      return res
        .status(400)
        .json({ message: "Prompt category name already exists" });
    }

    const promptCategory = await PromptCategory.findByIdAndUpdate(
      req.params.id,
      { name, description, type, promptText, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!promptCategory) {
      return res.status(404).json({ message: "Prompt category not found" });
    }

    res.status(200).json({
      message: "Prompt category updated successfully",
      promptCategory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a prompt category (admin only)
exports.deletePromptCategory = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const promptCategory = await PromptCategory.findByIdAndDelete(
      req.params.id
    );
    if (!promptCategory) {
      return res.status(404).json({ message: "Prompt category not found" });
    }

    res.status(200).json({
      message: "Prompt category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
