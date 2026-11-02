const express = require("express");
const router = express.Router();
const sendOrderEmail = require("../utils/sendOrderEmail");

router.post("/test", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Recipient email is required",
      });
    }

    const testOrder = {
      _id: "TEST-ORDER-001",
      trackingId: "RB-TEST-001",
      totalAmount: 2400,
      orderStatus: "PLACED",
      paymentMethod: "COD",
      items: [
        {
          name: "Rajlaxmi Boutique Test Product",
          quantity: 1,
          price: 2400,
        },
      ],
    };

    await sendOrderEmail({
      to: email,
      customerName: "Meghna",
      order: testOrder,
    });

    return res.json({
      success: true,
      message: "Test email sent successfully",
    });
  } catch (error) {
    console.error("Test email error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Test email failed",
      error: error.message,
      code: error.code || null,
    });
  }
});

module.exports = router;