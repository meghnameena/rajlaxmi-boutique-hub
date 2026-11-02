const express = require("express");
const { getDashboardStats ,
    getLowStockProducts,
    getRecentOrders,
} = require("../controllers/dashboardController");


const protect = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/stats", protect, adminMiddleware, getDashboardStats);
router.get("/low-stock",protect,adminMiddleware,getLowStockProducts);
router.get("/recent-orders", protect, adminMiddleware, getRecentOrders);
module.exports = router;
