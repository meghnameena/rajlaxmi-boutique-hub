const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
  chatWithAI,
  trackMyOrders,
} = require("../controllers/aiAgentController");

const router = express.Router();

// Chat endpoint
router.post("/chat", chatWithAI);

// Authenticated customer's order tracking
router.get("/my-orders", protect, trackMyOrders);

module.exports = router;