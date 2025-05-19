const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const mongoose = require("mongoose");
require("dotenv").config();

// Register models
require("./models/user.model");
require("./models/blacklistedToken.model");
require("./models/product.model");
require("./models/order.model");
require("./models/cart.model");
require("./models/category.model");
require("./models/review.model");
require("./models/voucher.model");
require("./models/subscription.model");
require("./models/promptCategory.model");

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
connectDB();

// CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:3000", // Local development
    "https://mattra-online-shop.vercel.app", // Production
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

// Routes
const userRoute = require("./routes/user.route");
const productRoute = require("./routes/product.route");
const categoryRoute = require("./routes/category.route");
const cartRoute = require("./routes/cart.route");
const orderRoute = require("./routes/order.route");
const subscriptionRoute = require("./routes/subscription.route");
const voucherRoute = require("./routes/voucher.route");
const geminiAIRoute = require("./routes/geminiAI.route");
const promptCategoryRoute = require("./routes/promptCategory.route");

app.use("/api/user", userRoute);
app.use("/api/product", productRoute);
app.use("/api/category", categoryRoute);
app.use("/api/cart", cartRoute);
app.use("/api/order", orderRoute);
app.use("/api/subscription", subscriptionRoute);
app.use("/api/voucher", voucherRoute);
app.use("/api/geminiAI", geminiAIRoute);
app.use("/api/promptCategory", promptCategoryRoute);

// Root endpoint
app.get("/", (req, res) => {
  res.send({ message: "Welcome to Mạt Trà" });
});

// Swagger UI Configuration
const CSS_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";
const JS_BUNDLE_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui-bundle.min.js";
const JS_PRESET_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui-standalone-preset.min.js";

app.use("/api-docs", swaggerUi.serve);
app.get(
  "/api-docs",
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      url: "/swagger.json",
      persistAuthorization: true,
      displayOperationId: true,
      tryItOutEnabled: process.env.NODE_ENV !== "production",
    },
    customCssUrl: CSS_CDN,
    customJs: [JS_BUNDLE_CDN, JS_PRESET_CDN],
    customSiteTitle: "Mạt Trà API Documentation",
  })
);

// Error Handling
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res
    .status(500)
    .json({ message: "Internal server error", error: err.message });
});

// Server Startup
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 9999;
  app.listen(PORT, () => {
    console.log(
      `Server is running at http://localhost:${PORT}\nAPI Docs: http://localhost:${PORT}/api-docs`
    );
  });
}

module.exports = app;
