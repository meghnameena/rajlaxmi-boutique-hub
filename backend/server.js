const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const aiAgentRoutes = require("./routes/aiAgentRoutes");
const imageRoutes = require("./routes/imageRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const emailRoutes = require("./routes/emailRoutes");

const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

connectDB();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/ai-agent", aiAgentRoutes);


// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Rajlaxmi Boutique Hub API is running 🚀",
  });
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});