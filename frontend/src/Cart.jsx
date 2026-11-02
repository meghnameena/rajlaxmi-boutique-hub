import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaMinus,
  FaPlus,
  FaTrash,
  FaShoppingBag,
  FaShieldAlt,
} from "react-icons/fa";
import api from "./api/axios";
import "./Cart.css";

function Cart() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItems, setUpdatingItems] = useState([]);
  const [removingItems, setRemovingItems] = useState([]);

  const getPrice = (product) =>
    Number(product?.salePrice ?? product?.price ?? 0);

  const getProductId = (item) =>
    String(item?.product?._id ?? item?.product?.id ?? "");

  const getItemKey = (item, index) =>
    `${getProductId(item)}-${item?.size ?? ""}-${item?.color ?? ""}-${index}`;

  const loadCart = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get("/cart");

      if (response.data?.success) {
        const cartItems = response.data.cart?.items || [];
        setItems(cartItems);
      } else {
        setItems([]);
        setError(response.data?.message || "Cart load nahi ho paaya.");
      }
    } catch (err) {
      console.error("Load Cart Error:", err.response?.data || err.message);

      setError(
        err.response?.data?.message ||
          "Cart load nahi ho paaya. Please dobara try karein."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const validItems = items.filter((item) => item?.product);

  const totalItems = validItems.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0
  );

  const subtotal = validItems.reduce(
    (total, item) =>
      total + getPrice(item.product) * (Number(item.quantity) || 0),
    0
  );

  // Current UI shipping rule: free shipping on orders of ₹999 or more.
  // Checkout/backend should apply the same rule.
  const freeShipping = subtotal >= 999;

  const updateQuantity = async (item, quantity, itemKey) => {
    if (quantity < 1) return;

    const product = item.product;
    const stock = Number(product?.stock);

    if (Number.isFinite(stock) && quantity > stock) {
      alert("Itni quantity available nahi hai.");
      return;
    }

    if (updatingItems.includes(itemKey)) return;

    try {
      setUpdatingItems((previous) => [...previous, itemKey]);

      const response = await api.put("/cart/update", {
        productId: product._id ?? product.id,
        quantity,
      });

      if (response.data?.success) {
        await loadCart();
      } else {
        alert(response.data?.message || "Quantity update nahi hui.");
      }
    } catch (err) {
      console.error("Update Quantity Error:", err.response?.data || err.message);

      alert(
        err.response?.data?.message ||
          "Quantity update nahi hui. Please dobara try karein."
      );
    } finally {
      setUpdatingItems((previous) =>
        previous.filter((key) => key !== itemKey)
      );
    }
  };

  const removeItem = async (item, itemKey) => {
    if (removingItems.includes(itemKey)) return;

    try {
      setRemovingItems((previous) => [...previous, itemKey]);

      const response = await api.delete("/cart/remove", {
        data: {
          productId: item.product._id ?? item.product.id,
          size: item.size ?? null,
          color: item.color ?? null,
        },
      });

      if (response.data?.success) {
        await loadCart();
      } else {
        alert(response.data?.message || "Product remove nahi hua.");
      }
    } catch (err) {
      console.error("Remove Item Error:", err.response?.data || err.message);

      alert(
        err.response?.data?.message ||
          "Product remove nahi hua. Please dobara try karein."
      );
    } finally {
      setRemovingItems((previous) =>
        previous.filter((key) => key !== itemKey)
      );
    }
  };

  if (loading) {
    return (
      <div className="cart-message">
        <div className="cart-loader" />
        <p>Loading your shopping bag...</p>
      </div>
    );
  }

  return (
    <main className="cart-page">
      <button
        type="button"
        className="cart-back"
        onClick={() => navigate("/")}
      >
        <FaArrowLeft />
        Continue Shopping
      </button>

      <header className="cart-heading">
        <span className="cart-brand">RAJLAXMI BOUTIQUE</span>

        <h1>Your Shopping Bag</h1>

        <p>
          {totalItems} {totalItems === 1 ? "item" : "items"} in your bag
        </p>

        <div className="cart-heading-line" />
      </header>

      {error ? (
        <section className="cart-error">
          <h2>Oops! Something went wrong.</h2>
          <p>{error}</p>

          <button type="button" onClick={loadCart}>
            Try Again
          </button>
        </section>
      ) : validItems.length === 0 ? (
        <section className="cart-empty">
          <div className="cart-empty-icon">
            <FaShoppingBag />
          </div>

          <h2>Your bag is waiting for something beautiful.</h2>

          <p>
            Discover elegant sarees, suits, kurtis and more from Rajlaxmi
            Boutique.
          </p>

          <button type="button" onClick={() => navigate("/")}>
            Explore Collection
          </button>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-items-section">
            <div className="cart-section-heading">
              <h2>Your Items</h2>
              <span>{totalItems} item(s)</span>
            </div>

            <div className="cart-items">
              {validItems.map((item, index) => {
                const product = item.product;
                const itemKey = getItemKey(item, index);
                const price = getPrice(product);
                const quantity = Number(item.quantity) || 1;
                const stock = Number(product.stock);
                const isUpdating = updatingItems.includes(itemKey);
                const isRemoving = removingItems.includes(itemKey);

                const image =
                  product.images?.find(
                    (img) => typeof img === "string" && img.trim()
                  ) ||
                  product.image ||
                  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80";

                return (
                  <article className="cart-item" key={itemKey}>
                    <button
                      type="button"
                      className="cart-image-button"
                      onClick={() =>
                        navigate(
                          `/product/${product._id ?? product.id}`
                        )
                      }
                      aria-label={`View ${product.name}`}
                    >
                      <img
                        className="cart-product-image"
                        src={image}
                        alt={product.name || "Boutique product"}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80";
                        }}
                      />
                    </button>

                    <div className="cart-product-info">
                      <span className="cart-category">
                        {product.category || "Rajlaxmi Collection"}
                      </span>

                      <button
                        type="button"
                        className="cart-product-name"
                        onClick={() =>
                          navigate(
                            `/product/${product._id ?? product.id}`
                          )
                        }
                      >
                        {product.name || "Boutique Product"}
                      </button>

                      {item.size && (
                        <p>
                          <span>Size:</span> {item.size}
                        </p>
                      )}

                      {item.color && (
                        <p>
                          <span>Color:</span> {item.color}
                        </p>
                      )}

                      <div className="cart-price">
                        ₹{price.toLocaleString("en-IN")}
                      </div>

                      <div className="cart-quantity-label">Quantity</div>

                      <div className="cart-product-actions">
                        <div className="cart-quantity">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={quantity <= 1 || isUpdating || isRemoving}
                            onClick={() =>
                              updateQuantity(item, quantity - 1, itemKey)
                            }
                          >
                            <FaMinus />
                          </button>

                          <span>{isUpdating ? "…" : quantity}</span>

                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={
                              isUpdating ||
                              isRemoving ||
                              (Number.isFinite(stock) && quantity >= stock)
                            }
                            onClick={() =>
                              updateQuantity(item, quantity + 1, itemKey)
                            }
                          >
                            <FaPlus />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cart-remove"
                          disabled={isRemoving || isUpdating}
                          onClick={() => removeItem(item, itemKey)}
                        >
                          <FaTrash />
                          {isRemoving ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>

                    <div className="cart-line-total">
                      <span>Item Total</span>
                      <strong>
                        ₹{(price * quantity).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </article>
                );
              })}
            </div>

            <button
              type="button"
              className="cart-continue-bottom"
              onClick={() => navigate("/")}
            >
              <FaArrowLeft />
              Continue Shopping
            </button>
          </section>

          <aside className="cart-summary">
            <h2>Order Summary</h2>

            <div className="cart-summary-row">
              <span>Total Items</span>
              <span>{totalItems}</span>
            </div>

            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

            <div className="cart-summary-row">
              <span>Shipping</span>
              <span className={freeShipping ? "cart-free-shipping" : ""}>
                {freeShipping ? "Free" : "Calculated at checkout"}
              </span>
            </div>

            {!freeShipping && subtotal > 0 && (
              <div className="cart-shipping-note">
                Shop for ₹
                {Math.max(0, 999 - subtotal).toLocaleString("en-IN")} more to
                qualify for free shipping.
              </div>
            )}

            <hr />

            <div className="cart-summary-row cart-total">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

            <p className="cart-tax-note">
              Final shipping charges, if applicable, will be confirmed at
              checkout.
            </p>

            <button
              type="button"
              className="cart-checkout"
              disabled={totalItems === 0}
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout
            </button>

            <div className="cart-secure">
              <FaShieldAlt />
              <span>Secure shopping at Rajlaxmi Boutique</span>
            </div>

            <div className="cart-payment-note">
              Your selected products are waiting for you.
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

export default Cart;