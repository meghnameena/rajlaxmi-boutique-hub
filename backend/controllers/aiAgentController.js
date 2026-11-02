const OpenAI = require("openai");
const Product = require("../models/Product");
const Order = require("../models/orderModel");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Shopping Assistant
const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message.",
      });
    }

    const products = await Product.find({
      status: "active",
      stock: { $gt: 0 },
    })
      .select(
        "name category description price salePrice stock sizes colors images"
      )
      .limit(100)
      .lean();

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/$/, "");

    const productContext = products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      category: product.category,
      description: product.description || "",
      price: product.price,
      salePrice: product.salePrice ?? null,
      stock: product.stock,
      sizes: product.sizes || [],
      colors: product.colors || [],

      // Direct product page link
      productUrl: `${frontendUrl}/product/${product._id}`,

      // Keep image URL separate from product link
      imageUrl: Array.isArray(product.images)
        ? product.images[0] || ""
        : "",
    }));

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",

      instructions: `
You are the friendly AI shopping assistant for Rajlaxmi Boutique.

Rules:
- Reply in the customer's language, Hindi or English.
- Recommend only products in the supplied catalogue.
- Never invent product names, prices, sizes, colours or stock.
- Use salePrice when available; otherwise use price.
- For each recommended product, show its name, price, and exactly ONE Markdown link: [View Product](PRODUCT_URL).
- Do not repeat the product link.
- Never print the raw product URL separately.
- Never write "View Product" outside the Markdown link.
- Format links like [View Product](PRODUCT_URL).
- Never use imageUrl as the shopping link.
- Do not invent or modify product URLs.
- Never claim an order has been placed, cancelled or changed.
- Never request passwords, JWT tokens or payment credentials.
- Keep replies friendly and concise.
      `,

      input: `
PRODUCT CATALOGUE:
${JSON.stringify(productContext)}

CUSTOMER MESSAGE:
${message.trim()}
      `,
    });

    return res.status(200).json({
      success: true,
      reply: response.output_text,
    });
  } catch (error) {
    console.error("AI Agent Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "AI assistant is temporarily unavailable.",
    });
  }
};

// Secure order tracking for the logged-in customer
const trackMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
    })
      .select(
        "items totalAmount paymentStatus orderStatus createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("AI Order Tracking Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your orders.",
    });
  }
};


module.exports = {
  chatWithAI,
  trackMyOrders,
};