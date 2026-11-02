const express = require("express");

const {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const protect = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Public: Get all products
router.get("/", getProducts);

// Public: Get a single product
router.get("/:id", getProductById);

// Admin only: Add a product
router.post("/", protect, adminMiddleware, addProduct);

// Admin only: Update a product
router.put("/:id", protect, adminMiddleware, updateProduct);

// Admin only: Delete a product
router.delete("/:id", protect, adminMiddleware, deleteProduct);

module.exports = router;