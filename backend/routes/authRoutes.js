const express = require("express");

const {
  registerUser,
  loginUser,
  getCurrentUser,
} = require("../controllers/authController");


const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Register User
router.post("/register", registerUser);

// Login User
router.post("/login", loginUser);

router.get("/me", protect, getCurrentUser);

module.exports = router;