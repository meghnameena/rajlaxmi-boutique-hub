const Cart = require("../models/cartModel");
const Product = require("../models/Product");

// Add product to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const qty = Number(quantity ?? 1);

    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Product is not available",
      });
    }

    // Normalize size and color
    const normalizedSize = size
      ? String(size).trim().toUpperCase()
      : null;

    const normalizedColor = color
      ? String(color).trim()
      : null;

    // Validate available size
    if (
      normalizedSize &&
      !product.sizes.some(
        (s) => s.toUpperCase() === normalizedSize
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Selected size is unavailable",
      });
    }

    // Validate available color (case-insensitive)
    if (
      normalizedColor &&
      !product.colors.some(
        (c) => c.toLowerCase() === normalizedColor.toLowerCase()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Selected color is unavailable",
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.size === normalizedSize &&
        (
          item.color || ""
        ).toLowerCase() === (
          normalizedColor || ""
        ).toLowerCase()
    );

    const newQuantity = existingItem
      ? existingItem.quantity + qty
      : qty;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    if (existingItem) {
      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        product: productId,
        quantity: qty,
        size: normalizedSize,
        color: normalizedColor,
      });
    }

    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Add To Cart Error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get user's cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.id,
    }).populate("items.product");

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        cart: { items: [] },
        totalItems: 0,
        subtotal: 0,
      });
    }

    // Calculate total quantity of items
    const totalItems = cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    // Calculate subtotal using sale price when available
    const subtotal = cart.items.reduce((total, item) => {
      const product = item.product;

      if (!product) return total;

      const price = product.salePrice ?? product.price;

      return total + price * item.quantity;
    }, 0);

    return res.status(200).json({
      success: true,
      cart,
      totalItems,
      subtotal,
    });
  } catch (error) {
    console.error("Get Cart Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    item.quantity = quantity;

    await cart.save();

    await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      cart,
    });
  } catch (error) {
    console.error("Update Cart Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { productId, size, color } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.size === (size || null) &&
        item.color === (color || null)
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found in cart",
      });
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Remove From Cart Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
};
