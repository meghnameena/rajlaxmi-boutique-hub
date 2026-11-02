const Order = require("../models/orderModel");
const Product = require("../models/Product");

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      shippedOrders,
      cancelledOrders,
      deliveredOrders,
      totalProducts,
      salesResult,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "PLACED" }),
      Order.countDocuments({ orderStatus: "SHIPPED" }),
      Order.countDocuments({ orderStatus: "CANCELLED" }),
      Order.countDocuments({ orderStatus: "DELIVERED" }),
      Product.countDocuments(),
      Order.aggregate([
        {
          $match: {
            orderStatus: { $ne: "CANCELLED" },
            paymentMethod: "COD",
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

    const totalSales = salesResult.length
      ? salesResult[0].totalSales
      : 0;

    return res.status(200).json({
      success: true,
      dashboard: {
        totalOrders,
        totalSales,
        pendingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalProducts,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};


const getLowStockProducts = async (req, res) => {
  try {
    const threshold = 5;

    const products = await Product.find({
      stock: { $lte: threshold },
      status: "active",
    })
      .select("name category price salePrice stock sku images status")
      .sort({ stock: 1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      threshold,
      products,
    });
  } catch (error) {
    console.error("Low Stock Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch low-stock products",
    });
  }
};


const getRecentOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .select(
        "user items totalAmount paymentMethod paymentStatus orderStatus shippingAddress createdAt"
      );

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Recent Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent orders",
    });
  }
};


module.exports = { getDashboardStats ,
    getLowStockProducts,
    getRecentOrders,
};
