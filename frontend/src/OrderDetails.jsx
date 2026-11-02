import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "./api/axios";
import "./Orders.css";

const ORDER_STEPS = [
  { status: "PLACED", label: "Order Placed", icon: "✓" },
  { status: "CONFIRMED", label: "Confirmed", icon: "✓" },
  { status: "PROCESSING", label: "Processing", icon: "⚙" },
  { status: "SHIPPED", label: "Shipped", icon: "🚚" },
  { status: "DELIVERED", label: "Delivered", icon: "♥" },
];

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    let active = true;

    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${orderId}`);

        if (active) {
          setOrder(response.data.order);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Order details load nahi ho paayi."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOrder();

    // Refresh status automatically every 30 seconds.
    const interval = setInterval(fetchOrder, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="orders-message">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <main className="orders-page">
        <button
          className="orders-back"
          onClick={() => navigate("/my-orders")}
        >
          ← Back to My Orders
        </button>

        <div className="orders-error">
          {error || "Order not found"}
        </div>
      </main>
    );
  }

  const address = order.shippingAddress || {};
  const cancelled = order.orderStatus === "CANCELLED";

  const currentStep = ORDER_STEPS.findIndex(
    (step) => step.status === order.orderStatus
  );

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <main className="orders-page">
      <button
        className="orders-back"
        onClick={() => navigate("/my-orders")}
      >
        ← Back to My Orders
      </button>

      <header className="orders-heading">
        <span>RAJLAXMI BOUTIQUE</span>
        <h1>Order Details</h1>
        <p>
          Order #{order._id.slice(-8).toUpperCase()}
        </p>
      </header>

      {/* Tracking Information */}
      <section className="rb-tracking-panel">
        <div className="rb-tracking-header">
          <div>
            <span className="rb-tracking-eyebrow">
              YOUR ORDER JOURNEY
            </span>
            <h2>
              {cancelled
                ? "Order Cancelled"
                : order.orderStatus === "DELIVERED"
                ? "Your order has arrived! 💗"
                : "Track Your Order"}
            </h2>
            <p>
              Thank you for shopping with Rajlaxmi Boutique.
            </p>
          </div>

          <span
            className={`rb-status-badge ${
              cancelled ? "is-cancelled" : ""
            }`}
          >
            {order.orderStatus}
          </span>
        </div>

        <div className="rb-tracking-meta">
          <div>
            <span>Tracking ID</span>
            <strong>
              {order.trackingId || "Not generated"}
            </strong>
          </div>

          <div>
            <span>Estimated Delivery</span>
            <strong>
              {order.estimatedDelivery
                ? formatDate(order.estimatedDelivery)
                : "Will be updated soon"}
            </strong>
          </div>
        </div>

        {cancelled ? (
          <div className="rb-cancelled-message">
            This order has been cancelled. Please contact
            Rajlaxmi Boutique if you need assistance.
          </div>
        ) : (
          <div className="rb-timeline">
            {ORDER_STEPS.map((step, index) => {
              const completed =
                currentStep >= 0 && index <= currentStep;

              const active = index === currentStep;

              return (
                <div
                  className={`rb-timeline-step ${
                    completed ? "completed" : ""
                  } ${active ? "active" : ""}`}
                  key={step.status}
                >
                  <div className="rb-timeline-icon">
                    {completed ? "✓" : step.icon}
                  </div>

                  <strong>{step.label}</strong>

                  {active && (
                    <span className="rb-current-label">
                      Current status
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="rb-refresh-note">
          Order status refreshes automatically every 30 seconds.
        </p>
      </section>

      <section className="order-details-layout">
        <article className="order-details-panel">
          <h2>Order Information</h2>

          <div className="detail-row">
            <span>Order ID</span>
            <strong>{order._id}</strong>
          </div>

          <div className="detail-row">
            <span>Order Date</span>
            <strong>
              {new Date(order.createdAt).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="detail-row">
            <span>Order Status</span>
            <strong>{order.orderStatus}</strong>
          </div>

          <div className="detail-row">
            <span>Payment Method</span>
            <strong>
              {order.paymentMethod === "COD"
                ? "Cash on Delivery"
                : order.paymentMethod}
            </strong>
          </div>

          <div className="detail-row">
            <span>Payment Status</span>
            <strong>{order.paymentStatus}</strong>
          </div>
        </article>

        <article className="order-details-panel">
          <h2>Delivery Address</h2>

          <p><strong>{address.fullName}</strong></p>
          <p>{address.phone}</p>
          <p>{address.address}</p>
          <p>{address.city}, {address.state}</p>
          <p>PIN: {address.pincode}</p>
        </article>

        <article className="order-details-panel order-details-products">
          <h2>Products Ordered</h2>

          {(order.items || []).map((item, index) => {
            const product = item.product;

            const name =
              item.name || product?.name || "Boutique Product";

            const image =
              (typeof item.image === "string" && item.image.trim()) ||
              (typeof product?.images?.[0] === "string" &&
                product.images[0].trim()) ||
              (typeof item.images?.[0] === "string" &&
                item.images[0].trim()) ||
              "";

            return (
              <div
                className="order-product"
                key={`${product?._id || product || index}-${index}`}
              >
                {image && (
                  <img
                    src={image}
                    alt={name}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      event.currentTarget.nextElementSibling?.style.setProperty(
                        "display",
                        "flex"
                      );
                    }}
                  />
                )}

                <div
                  className="order-product-placeholder"
                  style={{ display: image ? "none" : "flex" }}
                >
                  R
                </div>

                <div className="order-product-info">
                  <h3>{name}</h3>
                  <p>Quantity: {item.quantity}</p>

                  {item.size && <p>Size: {item.size}</p>}
                  {item.color && <p>Color: {item.color}</p>}
                </div>

                <strong>
                  ₹{(
                    Number(item.price || 0) *
                    Number(item.quantity || 0)
                  ).toLocaleString("en-IN")}
                </strong>
              </div>
            );
          })}

          <div className="detail-row">
            <span>Subtotal</span>
            <strong>
              ₹{Number(order.subtotal || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="detail-row">
            <span>Shipping</span>
            <strong>
              {Number(order.shippingCharge || 0) === 0
                ? "Free"
                : `₹${Number(order.shippingCharge).toLocaleString("en-IN")}`}
            </strong>
          </div>

          <div className="detail-row order-detail-total">
            <span>Total</span>
            <strong>
              ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
            </strong>
          </div>
        </article>
      </section>
    </main>
  );
}

export default OrderDetails;