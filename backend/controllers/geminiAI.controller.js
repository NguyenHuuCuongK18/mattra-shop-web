const { GoogleGenAI } = require("@google/genai");
const PromptCategory = require("../models/promptCategory.model");

// Helper function to send prompt to Gemini AI
const sendToGeminiAI = async (prompt) => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_AI_API_KEY,
  });

  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  return result?.response?.text || result.text || "No response";
};

// Generate default response (user prompt only)
exports.generateDefaultResponse = async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validate prompt
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const text = await sendToGeminiAI(prompt);
    res.status(200).json({
      message: "Default response generated successfully",
      response: text,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate combined response (prompt category + user prompt)
exports.generateCombinedResponse = async (req, res) => {
  try {
    const { prompt, promptCategoryId } = req.body;

    // Validate prompt
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    let combinedPrompt = prompt;

    // If promptCategoryId is provided, fetch the prompt category
    if (promptCategoryId) {
      const promptCategory = await PromptCategory.findById(promptCategoryId);
      if (!promptCategory) {
        return res.status(404).json({ message: "Prompt category not found" });
      }
      // Combine promptText with user prompt
      combinedPrompt = `${promptCategory.promptText} ${prompt}`;
    }

    const text = await sendToGeminiAI(combinedPrompt);
    res.status(200).json({
      message: "Combined response generated successfully",
      response: text,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
