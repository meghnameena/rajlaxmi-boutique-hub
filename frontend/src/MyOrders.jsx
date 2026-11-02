import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api/axios";
import "./Orders.css";

function formatPrice(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function MyOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setError("");

      const response = await api.get("/orders/my-orders");

      setOrders(response.data.orders || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Orders load nahi ho paaye. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    fetchOrders();
  }, [navigate]);

  const handleCancelOrder = async (orderId, orderStatus) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    try {
      setCancellingId(orderId);
      setError("");

      const response = await api.put(
        `/orders/${orderId}/cancel`
      );

      if (response.data.success) {
        alert("Order cancelled successfully!");
        await fetchOrders();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Order cancel nahi ho paaya."
      );
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="orders-message">
        Loading your orders...
      </div>
    );
  }

  return (
    <main className="orders-page">
      <button
        className="orders-back"
        onClick={() => navigate("/")}
      >
        ← Continue Shopping
      </button>

      <header className="orders-heading">
        <span>RAJLAXMI BOUTIQUE</span>
        <h1>My Orders</h1>
        <p>Your purchases, all in one place.</p>
      </header>

      {error && (
        <div className="orders-error">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <section className="orders-empty">
          <div className="orders-empty-icon">♡</div>

          <h2>No orders yet</h2>

          <p>
            Your next favourite outfit is waiting for you.
          </p>

          <button onClick={() => navigate("/")}>
            Explore Collection
          </button>
        </section>
      ) : (
        <section className="orders-list">
          {orders.map((order) => {
            const items = order.items || [];

            const canCancel = [
              "PLACED",
              "CONFIRMED",
            ].includes(order.orderStatus);

            return (
              <article
                className="order-card"
                key={order._id}
              >
                <div className="order-card-header">
                  <div>
                    <span className="order-label">
                      ORDER ID
                    </span>

                    <strong className="order-id">
                      #{order._id.slice(-8).toUpperCase()}
                    </strong>

                    <p className="order-date">
                      Placed on{" "}
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`order-status status-${(
                      order.orderStatus || ""
                    ).toLowerCase()}`}
                  >
                    {(order.orderStatus || "UNKNOWN").replace(
                      /_/g,
                      " "
                    )}
                  </span>
                </div>

                <div className="order-card-products">
                  {items.map((item, index) => {
                    const product = item.product;
                    const productName =
                      item.name ||
                      product?.name ||
                      "Boutique Product";

                    const image =
                      item.image ||
                      product?.images?.[0] ||
                      "";

                    return (
                      <div
                        className="order-product"
                        key={`${product?._id || product || index}-${index}`}
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={productName}
                          />
                        ) : (
                          <div className="order-product-placeholder">
                            R
                          </div>
                        )}

                        <div className="order-product-info">
                          <h3>{productName}</h3>

                          <p>
                            Quantity: {item.quantity}
                          </p>

                          {item.size && (
                            <p>Size: {item.size}</p>
                          )}

                          {item.color && (
                            <p>Color: {item.color}</p>
                          )}
                        </div>

                        <strong>
                          {formatPrice(
                            (item.price ?? 0) * item.quantity
                          )}
                        </strong>
                      </div>
                    );
                  })}
                </div>

                <div className="order-card-footer">
                  <div>
                    <span>Total Amount</span>
                    <strong>
                      {formatPrice(order.totalAmount)}
                    </strong>

                    <p>
                      Payment:{" "}
                      {order.paymentMethod === "COD"
                        ? "Cash on Delivery"
                        : order.paymentMethod}
                    </p>

                    <p>
                      Payment Status:{" "}
                      {order.paymentStatus || "PENDING"}
                    </p>
                  </div>

                  <div className="order-actions">
                    <button
                      className="order-details-button"
                      onClick={() =>
                        navigate(`/my-orders/${order._id}`)
                      }
                    >
                      View Details
                    </button>

                    {canCancel && (
                      <button
                        className="order-cancel-button"
                        disabled={cancellingId === order._id}
                        onClick={() =>
                          handleCancelOrder(
                            order._id,
                            order.orderStatus
                          )
                        }
                      >
                        {cancellingId === order._id
                          ? "Cancelling..."
                          : "Cancel Order"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default MyOrders;