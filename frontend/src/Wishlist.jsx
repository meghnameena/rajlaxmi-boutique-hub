import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaShoppingBag,
  FaTrash,
  FaArrowLeft,
} from "react-icons/fa";
import "./Wishlist.css";

// Get current user's unique wishlist key
const getWishlistKey = () => {
  const token = localStorage.getItem("token");

  if (!token) return "wishlist_guest";

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    const userId =
      payload.id ||
      payload._id ||
      payload.userId ||
      payload.sub;

    if (userId) {
      return `wishlist_${userId}`;
    }
  } catch (error) {
    console.error("Unable to identify wishlist account:", error);
  }

  return "wishlist_guest";
};

function Wishlist() {
  const navigate = useNavigate();

  const [wishlistKey] = useState(() => getWishlistKey());

  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(getWishlistKey())) || [];
    } catch {
      return [];
    }
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products");
        const data = await response.json();

        if (response.ok && data.success) {
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Wishlist products error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const wishlistProducts = products.filter((product) =>
    wishlist.includes(String(product._id || product.id))
  );

  const removeFromWishlist = (productId) => {
    const updatedWishlist = wishlist.filter(
      (id) => String(id) !== String(productId)
    );

    setWishlist(updatedWishlist);
    localStorage.setItem(wishlistKey, JSON.stringify(updatedWishlist));
  };

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <span className="wishlist-eyebrow">
          YOUR PERSONAL COLLECTION
        </span>

        <h1>
          My Wishlist <FaHeart />
        </h1>

        <p>Your favourite styles, all in one place.</p>
      </div>

      {loading ? (
        <div className="wishlist-empty">
          <h2>Loading your favourites...</h2>
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className="wishlist-empty">
          <FaHeart className="empty-heart" />
          <h2>Your wishlist is waiting!</h2>
          <p>
            Explore our collection and save the styles you love.
          </p>

          <button
            className="wishlist-primary-btn"
            onClick={() => navigate("/")}
          >
            <FaArrowLeft /> Explore Collection
          </button>
        </div>
      ) : (
        <>
          <div className="wishlist-count">
            {wishlistProducts.length} favourite products
          </div>

          <div className="wishlist-grid">
            {wishlistProducts.map((product) => (
              <article
                className="wishlist-card"
                key={product._id || product.id}
              >
                <div
                  className="wishlist-image"
                  onClick={() =>
                    navigate(`/product/${product._id || product.id}`)
                  }
                >
                  <img
                    src={
                      product.images?.find(Boolean) ||
                      product.image ||
                      "https://placehold.co/400x500?text=Rajlaxmi+Boutique"
                    }
                    alt={product.name}
                  />
                </div>

                <div className="wishlist-card-content">
                  <span className="wishlist-category">
                    {product.category || "Ethnic Wear"}
                  </span>

                  <h3>{product.name}</h3>

                  <div className="wishlist-price">
                    ₹
                    {Number(
                      product.salePrice || product.price || 0
                    ).toLocaleString("en-IN")}
                  </div>

                  <div className="wishlist-actions">
                    <button
                      className="wishlist-cart-btn"
                      onClick={() =>
                        navigate(`/product/${product._id || product.id}`)
                      }
                    >
                      <FaShoppingBag /> View Product
                    </button>

                    <button
                      className="wishlist-remove-btn"
                      onClick={() =>
                        removeFromWishlist(product._id || product.id)
                      }
                      title="Remove from Wishlist"
                      aria-label={`Remove ${product.name} from wishlist`}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Wishlist;