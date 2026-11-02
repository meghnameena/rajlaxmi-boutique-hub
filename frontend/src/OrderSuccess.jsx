import { useLocation, useNavigate } from "react-router-dom";
import "./OrderSuccess.css";

function OrderSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const order = state?.order;

  return (
    <main className="order-success-page">
      <section className="order-success-card">
        <div className="order-success-icon">✓</div>

        <span>RAJLAXMI BOUTIQUE</span>
        <h1>Thank You for Your Order!</h1>

        <p>
          Your order has been placed successfully. We appreciate your trust
          in Rajlaxmi Boutique.
        </p>

        {order ? (
          <div className="order-success-details">
            <div>
              <span>Order ID</span>
              <strong>{order._id}</strong>
            </div>

            <div>
              <span>Order Total</span>
              <strong>
                ₹{Number(order.totalAmount).toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>Payment Method</span>
              <strong>
                {order.paymentMethod === "COD"
                  ? "Cash on Delivery"
                  : "Online Payment"}
              </strong>
            </div>

            <div>
              <span>Order Status</span>
              <strong>{order.orderStatus}</strong>
            </div>
          </div>
        ) : (
          <p>Order details are not available on this screen.</p>
        )}

        <button onClick={() => navigate("/")}>Continue Shopping</button>
      </section>
    </main>
  );
}

export default OrderSuccess;
