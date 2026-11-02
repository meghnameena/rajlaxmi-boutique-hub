import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api/axios";
import "./Checkout.css";

const initialAddress = {
  fullName: "",
  phone: "",
  address: "",
  city: "",
  state: "Rajasthan",
  pincode: "",
};

function Checkout() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    const loadCart = async () => {
      try {
        const response = await api.get("/cart");
        setItems(response.data.cart?.items || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Cart load nahi ho paaya."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [navigate]);

  const subtotal = items.reduce((total, item) => {
    const product = item.product;
    if (!product) return total;

    const price = product.salePrice ?? product.price;
    return total + price * item.quantity;
  }, 0);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setError("Valid 10-digit Indian mobile number enter karo.");
      return;
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      setError("Valid 6-digit PIN code enter karo.");
      return;
    }

    try {
      setSubmitting(true);

     const response = await api.post("/orders/checkout", {
        shippingAddress: form,
        paymentMethod,
        });

      if (response.data.success) {
        navigate("/order-success", {
          state: { order: response.data.order },
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Order place nahi ho paaya."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="checkout-message">Loading checkout...</div>;
  }

  return (
    <main className="checkout-page">
      <button
        type="button"
        className="checkout-back"
        onClick={() => navigate("/cart")}
      >
        ← Back to Bag
      </button>

      <header className="checkout-heading">
        <span>RAJLAXMI BOUTIQUE</span>
        <h1>Secure Checkout</h1>
        <p>Almost yours. Complete your delivery details.</p>
      </header>

      {error && <div className="checkout-error">{error}</div>}

      {items.length === 0 ? (
        <section className="checkout-empty">
          <h2>Your shopping bag is empty.</h2>
          <button type="button" onClick={() => navigate("/")}>
            Explore Collection
          </button>
        </section>
      ) : (
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handlePlaceOrder}>
            <h2>Delivery Address</h2>

            <label>
              Full Name
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                maxLength={100}
                autoComplete="name"
                placeholder="Enter your full name"
              />
            </label>

            <label>
              Mobile Number
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
                maxLength={10}
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit mobile number"
              />
            </label>

            <label>
              House No. / Street / Full Address
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                maxLength={300}
                autoComplete="street-address"
                placeholder="Enter your complete delivery address"
              />
            </label>

            <div className="checkout-fields">
              <label>
                City
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  autoComplete="address-level2"
                  placeholder="City"
                />
              </label>

              <label>
                State
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  required
                  autoComplete="address-level1"
                  placeholder="State"
                />
              </label>
            </div>

            <label>
              PIN Code
              <input
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                required
                maxLength={6}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="6-digit PIN code"
              />
            </label>

            <h2 className="checkout-payment-heading">Payment Method</h2>

            <label className="checkout-payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={paymentMethod === "COD"}
                onChange={(event) => setPaymentMethod(event.target.value)}
              />
              <span>
                <strong>Cash on Delivery</strong>
                <small>Pay when your order arrives.</small>
              </span>
            </label>

            <label className="checkout-payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="ONLINE"
                checked={paymentMethod === "ONLINE"}
                onChange={(event) => setPaymentMethod(event.target.value)}
              />
              <span>
                <strong>Online Payment</strong>
                <small>Payment gateway integration required.</small>
              </span>
            </label>

            {paymentMethod === "ONLINE" && (
              <p className="checkout-note">
                Online payment is not connected yet. Choose Cash on Delivery
                to place a real order safely for now.
              </p>
            )}

            <button
              className="checkout-place-order"
              type="submit"
              disabled={submitting || paymentMethod === "ONLINE"}
            >
              {submitting
                ? "Placing Order..."
                : `Place Order · ₹${subtotal.toLocaleString("en-IN")}`}
            </button>
          </form>

          <aside className="checkout-summary">
            <h2>Order Summary</h2>

            {items.map((item, index) => {
              const product = item.product;
              if (!product) return null;

              const price = product.salePrice ?? product.price;

              return (
                <div
                  className="checkout-summary-item"
                  key={`${product._id}-${index}`}
                >
                  <div>
                    <strong>{product.name}</strong>
                    <p>Quantity: {item.quantity}</p>
                  </div>

                  <span>
                    ₹{(price * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}

            <hr />

            <div className="checkout-summary-total">
              <span>Subtotal</span>
              <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
            </div>

            <div className="checkout-summary-total">
              <span>Shipping</span>
              <strong>Free</strong>
            </div>

            <div className="checkout-summary-total checkout-grand-total">
              <span>Total</span>
              <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

export default Checkout;
