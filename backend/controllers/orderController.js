const mongoose = require("mongoose");
const Cart = require("../models/cartModel");
const Product = require("../models/Product");
const Order = require("../models/orderModel");
const User = require("../models/User");
const sendOrderEmail = require("../utils/sendOrderEmail");
// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get All Orders Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders",
    });
  }
};


// Track order using Tracking ID
const trackOrder = async (req, res) => {
  try {
    const { trackingId } = req.params;

    if (!trackingId || !trackingId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tracking ID is required",
      });
    }

    const order = await Order.findOne({
      trackingId: trackingId.trim(),
      user: req.user.id,
    }).select(
      "trackingId orderStatus estimatedDelivery createdAt updatedAt items totalAmount shippingAddress.city"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found. Please check your Tracking ID.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order tracking details fetched successfully",
      order,
    });
  } catch (error) {
    console.error("Track Order Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to track order right now.",
    });
  }
};


// Create order from cart

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      shippingAddress,
      paymentMethod = "COD",
    } = req.body;

    // 1. Validate shipping address
    const requiredFields = [
      "fullName",
      "phone",
      "address",
      "city",
      "state",
      "pincode",
    ];

    if (
      !shippingAddress ||
      requiredFields.some(
        (field) =>
          typeof shippingAddress[field] !== "string" ||
          !shippingAddress[field].trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required",
      });
    }

    // 2. Validate payment method
    if (!["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    let createdOrder;

    // 3. Start database transaction
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({
        user: req.user.id,
      }).session(session);

      if (!cart || cart.items.length === 0) {
        const error = new Error("Your cart is empty");
        error.statusCode = 400;
        throw error;
      }

      const orderItems = [];
      let subtotal = 0;

      // 4. Process each cart item
      for (const item of cart.items) {
        const product = await Product.findById(
          item.product
        ).session(session);

        if (!product) {
          const error = new Error(
            "A product in your cart no longer exists"
          );
          error.statusCode = 400;
          throw error;
        }

        if (product.status !== "active") {
          const error = new Error(
            `${product.name} is currently unavailable`
          );
          error.statusCode = 400;
          throw error;
        }

        if (
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          product.stock < item.quantity
        ) {
          const error = new Error(
            `Insufficient stock for ${product.name}`
          );
          error.statusCode = 400;
          throw error;
        }

        // Validate selected size
        if (item.size) {
          const sizeAvailable =
            Array.isArray(product.sizes) &&
            product.sizes.some(
              (size) =>
                size.toLowerCase() ===
                item.size.trim().toLowerCase()
            );

          if (!sizeAvailable) {
            const error = new Error(
              `Selected size is unavailable for ${product.name}`
            );
            error.statusCode = 400;
            throw error;
          }
        }

        // Validate selected color
        if (item.color) {
          const colorAvailable =
            Array.isArray(product.colors) &&
            product.colors.some(
              (color) =>
                color.toLowerCase() ===
                item.color.trim().toLowerCase()
            );

          if (!colorAvailable) {
            const error = new Error(
              `Selected color is unavailable for ${product.name}`
            );
            error.statusCode = 400;
            throw error;
          }
        }

        // Calculate current product price
        const price =
          product.salePrice != null
            ? product.salePrice
            : product.price;

        if (!Number.isFinite(price) || price < 0) {
          const error = new Error(
            `Invalid price for ${product.name}`
          );
          error.statusCode = 400;
          throw error;
        }

        subtotal += price * item.quantity;

        const cleanImage =
          Array.isArray(product.images) &&
          typeof product.images[0] === "string"
            ? product.images[0].trim()
            : "";

        // Save product snapshot
        orderItems.push({
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          price,
          size: item.size || null,
          color: item.color || null,
          image: cleanImage,
        });

        // Reduce stock safely
        const stockUpdate = await Product.updateOne(
          {
            _id: product._id,
            stock: { $gte: item.quantity },
          },
          {
            $inc: {
              stock: -item.quantity,
            },
          },
          {
            session,
          }
        );

        if (stockUpdate.modifiedCount !== 1) {
          const error = new Error(
            `Stock changed while placing order for ${product.name}`
          );
          error.statusCode = 409;
          throw error;
        }
      }

      // Calculate order total
      const shippingCharge = 0;
      const totalAmount = subtotal + shippingCharge;
    
    // Estimate delivery in 5 days
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);


      // Create order
      const orders = await Order.create(
        [
          {
            user: req.user.id,
            items: orderItems,
            shippingAddress,
            subtotal,
            shippingCharge,
            totalAmount,
            paymentMethod,
            paymentStatus: "PENDING",
            orderStatus: "PLACED",
            trackingId,
            estimatedDelivery,
          },
        ],
        { session }
      );

      createdOrder = orders[0];

      // Clear cart after successful order
      cart.items = [];
      await cart.save({ session });
    });

    // 4. Transaction complete: fetch customer email
    let emailSent = false;

    try {
      const customer = await User.findById(req.user.id)
        .select("name email")
        .lean();

      if (customer?.email) {
        // Send confirmation email
        await sendOrderEmail({
          to: customer.email,
          customerName:
            createdOrder.shippingAddress.fullName ||
            customer.name ||
            "Customer",
          order: createdOrder,
        });

        // Record successful email delivery request
        await Order.updateOne(
          { _id: createdOrder._id },
          {
            $set: {
              confirmationEmailSent: true,
              confirmationEmailSentAt: new Date(),
            },
          }
        );

        emailSent = true;
      } else {
        console.error(
          "Order confirmation email skipped: customer email not found."
        );
      }
    } catch (emailError) {
      // Email failure must not undo a successfully placed order
      console.error(
        "Order confirmation email failed:",
        emailError.message
      );
    }

    // 5. Return successful order response
    const savedOrder = await Order.findById(createdOrder._id);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      emailSent,
      order: savedOrder || createdOrder,
    });
  } catch (error) {
    console.error("Create Order Error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode && error.statusCode < 500
          ? error.message
          : "Unable to place order. Please try again.",
    });
  } finally {
    await session.endSession();
  }
};



// Get logged-in user's orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
    })
      .populate("items.product", "name images category")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders",
    });
  }
};


// Get a specific order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find order belonging to the logged-in user
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
    }).populate("items.product", "name images category");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Order Details Error:", error.message);

    // Invalid MongoDB ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order details",
    });
  }
};

// Cancel an order
const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { orderId } = req.params;
    let cancelledOrder;

    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: orderId,
        user: req.user.id,
      }).session(session);

      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }

      if (!["PLACED", "CONFIRMED"].includes(order.orderStatus)) {
        const error = new Error(
          "This order cannot be cancelled at its current status"
        );
        error.statusCode = 400;
        throw error;
      }

      // Restore stock for every product in the order
      for (const item of order.items) {
        const restoredProduct = await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { new: true, session }
        );

        if (!restoredProduct) {
          throw new Error(
            `Product not found while restoring stock: ${item.product}`
          );
        }
      }

      order.orderStatus = "CANCELLED";
      await order.save({ session });

      cancelledOrder = order;
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to cancel order",
    });
  } finally {
    await session.endSession();
  }
};


// Admin: Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (["CANCELLED", "DELIVERED"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "This order cannot be updated",
      });
    }

    if (order.orderStatus === "SHIPPED" && orderStatus === "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: "Invalid order status transition",
      });
    }

    order.orderStatus = orderStatus;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error.message);

    return res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message:
        error.name === "CastError"
          ? "Invalid order ID"
          : "Unable to update order status",
    });
  }
};




module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  trackOrder,
};
