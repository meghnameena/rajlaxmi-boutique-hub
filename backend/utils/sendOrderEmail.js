const nodemailer = require("nodemailer");

const sendOrderEmail = async ({ to, customerName, order }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials are missing in .env");
  }

  if (!to) {
    throw new Error("Customer email address is missing");
  }

  // 1. Create transporter FIRST
 const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true,
});

  // 2. Verify SMTP connection
  try {
    await transporter.verify();
    console.log("✅ Gmail SMTP connection successful!");
  } catch (error) {
    console.error("❌ SMTP connection failed:", error.code, error.message);
    throw error;
  }

  const orderId = order.orderNumber || order._id;
  const trackingId = order.trackingId || "Generating soon";
  const amount = Number(order.totalAmount || 0).toLocaleString("en-IN");

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);

  const productRows = (order.items || [])
    .map((item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee">
          ${escapeHtml(item.name || item.product?.name || "Product")}
        </td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center">
          ${Number(item.quantity || 0)}
        </td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">
          ₹${Number(item.price || 0).toLocaleString("en-IN")}
        </td>
      </tr>
    `)
    .join("");

  const info = await transporter.sendMail({
    from: `"Rajlaxmi Boutique" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Rajlaxmi Boutique order confirmation! ❤️",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#42101f;background:#fffaf6;padding:25px">
        <div style="text-align:center;padding:20px;background:#7d1735;color:white">
          <h1 style="margin:0">RAJLAXMI BOUTIQUE</h1>
          <p style="margin-bottom:0">Style with love ❤️</p>
        </div>

        <div style="background:white;padding:24px;margin-top:18px">
          <h2>Thank you, ${escapeHtml(customerName || "Dear Customer")}! 💗</h2>

          <p>Your order has been placed successfully.</p>
          <p>Thank you for choosing Rajlaxmi Boutique. We're happy to be part of your style journey!</p>

          <div style="background:#fff5f0;padding:16px;border-radius:8px">
            <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
            <p><strong>Tracking ID:</strong> ${escapeHtml(trackingId)}</p>
            <p><strong>Order Status:</strong> ${escapeHtml(order.orderStatus || "PLACED")}</p>
            <p><strong>Payment Method:</strong> ${escapeHtml(order.paymentMethod || "COD")}</p>
            <p><strong>Order Total:</strong> ₹${amount}</p>
          </div>

          <h3>Order Details</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f8ece8">
                <th style="padding:10px;text-align:left">Product</th>
                <th style="padding:10px">Qty</th>
                <th style="padding:10px;text-align:right">Price</th>
              </tr>
            </thead>
            <tbody>${productRows}</tbody>
          </table>

          <p style="margin-top:25px">
            We'll keep you updated as your order progresses.
          </p>

          <p style="text-align:center;margin-top:30px">
            <strong>Thank you for shopping with us! ❤️</strong><br/>
            Team Rajlaxmi Boutique
          </p>
        </div>
      </div>
    `,
  });

  console.log("✅ Order confirmation email accepted:", info.messageId);

  return info;
};

module.exports = sendOrderEmail;
