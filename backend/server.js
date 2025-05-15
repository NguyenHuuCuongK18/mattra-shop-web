const express = require("express");
const app = express();
const connectDB = require("./config/db");
require("dotenv").config(); // load .env variables, only load once and trust that it will be available globally
// Register models
require("./models/users.model");
require("./models/blacklistedTokens.model");
require("./models/products.model");
require("./models/orders.model");
require("./models/carts.model");
require("./models/categories.model");
require("./models/faqs.model");
require("./models/reviews.model");
require("./models/vouchers.model");
require("./models/settings.model");

const userRoute = require("./routes/user.route");
app.get("/", async (req, res) => {
  try {
    res.send({ message: "Welcome to Mạt Trà" });
  } catch (error) {
    res.send({ error: error.message });
  }
});

connectDB();
app.use(express.json());
app.use("/api/users", userRoute);

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
