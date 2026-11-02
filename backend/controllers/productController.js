const Product = require("../models/Product");

// Add Product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      price,
      salePrice,
      stock,
      sku,
      sizes,
      colors,
      images,
      video,
    } = req.body;

    // Required fields
    if (!name || !category || price === undefined || !sku) {
      return res.status(400).json({
        success: false,
        message: "Name, category, price and SKU are required",
      });
    }

    // Validate stock
    const productStock = stock === undefined ? 0 : Number(stock);

    if (
      !Number.isInteger(productStock) ||
      productStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a non-negative integer",
      });
    }

    // Check duplicate SKU
    const existingProduct = await Product.findOne({ sku });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product with this SKU already exists",
      });
    }

    // Set status according to stock
    const status = productStock === 0
      ? "out_of_stock"
      : "active";

    // Create product
    const product = await Product.create({
      name,
      category,
      description,
      price,
      salePrice,
      stock: productStock,
      sku,
      sizes,
      colors,
      images,
      video,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Add Product Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get All Products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get Products Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get Single Product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get Product Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// Update Product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const updates = { ...req.body };

    // Validate stock when provided
    if (updates.stock !== undefined) {
      const productStock = Number(updates.stock);

      if (
        !Number.isInteger(productStock) ||
        productStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Stock must be a non-negative integer",
        });
      }

      updates.stock = productStock;

      // Automatically sync status with stock
      if (productStock === 0) {
        updates.status = "out_of_stock";
      } else if (
        product.status === "out_of_stock" &&
        updates.status === undefined
      ) {
        updates.status = "active";
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete Product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
module.exports = {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};