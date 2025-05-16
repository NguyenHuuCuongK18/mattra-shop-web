const express = require("express");
const app = express();
const connectDB = require("./config/db");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

require("dotenv").config(); // load .env variables, only load once and trust that it will be available globally
// Register models
require("./models/user.model");
require("./models/blacklistedToken.model");
require("./models/product.model");
require("./models/order.model");
require("./models/cart.model");
require("./models/category.model");
require("./models/faq.model");
require("./models/review.model");
require("./models/voucher.model");

app.get("/", async (req, res) => {
  try {
    res.send({ message: "Welcome to Mạt Trà" });
  } catch (error) {
    res.send({ error: error.message });
  }
});

app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    return res.status(200).json({});
  }
  next();
});

const userRoute = require("./routes/user.route");
const productRoute = require("./routes/product.route");
const categoryRoute = require("./routes/category.route");
const cartRoute = require("./routes/cart.route");
const orderRoute = require("./routes/order.route");
const subscriptionRoute = require("./routes/subscription.route");
const voucherRoute = require("./routes/voucher.route");
connectDB();
app.use(express.json());
app.use(morgan("dev"));
app.use("/api/user", userRoute);
app.use("/api/product", productRoute);
app.use("/api/category", categoryRoute);
app.use("/api/cart", cartRoute);
app.use("/api/order", orderRoute);
app.use("/api/subscription", subscriptionRoute);
app.use("/api/voucher", voucherRoute);

// Swagger setup
app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
