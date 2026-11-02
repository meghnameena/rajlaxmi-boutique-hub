const express = require("express");
const adminMiddleware = require("../middleware/adminMiddleware");
const { createOrder ,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus,
    trackOrder,

} = require("../controllers/orderController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create order / Checkout
router.get("/admin/all", protect,adminMiddleware,getAllOrders);
router.post("/checkout", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/:orderId", protect, getOrderById);
router.put("/:orderId/cancel", protect, cancelOrder);
router.put( "/admin/:orderId/status", protect,adminMiddleware,updateOrderStatus);
router.get("/track/:trackingId", protect, trackOrder);
module.exports = router;
