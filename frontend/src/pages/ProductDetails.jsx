import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ProductDetails.css";

const API_URL = "http://localhost:5000/api";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/products/${encodeURIComponent(id)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Product load nahi ho paya.");
        }

        const foundProduct = data.product || data.data || data;

        if (!foundProduct || !foundProduct._id) {
          throw new Error("Product nahi mila.");
        }

        setProduct(foundProduct);
        setActiveImage(0);
      } catch (err) {
        console.error("Product details error:", err);
        setError(err.message || "Product load nahi ho paya.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const images = Array.isArray(product?.images)
    ? product.images.filter((image) => typeof image === "string" && image)
    : [];

  const price = Number(product?.salePrice ?? product?.price ?? 0);
  const originalPrice = Number(product?.price ?? 0);
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  const stock = Number(product?.stock ?? 0);

  const addToCart = () => {
    if (sizes.length && !selectedSize) {
      alert("Please apna size select karein.");
      return;
    }

    if (colors.length && !selectedColor) {
      alert("Please apna colour select karein.");
      return;
    }

    if (stock < 1 || quantity > stock) {
      alert("Selected quantity ka stock available nahi hai.");
      return;
    }

    /*
      NOTE:
      Ye page product details load karta hai.
      Add to Cart ko tumhare existing Cart context/API se
      connect karna hoga, agar tumhara project custom cart use karta hai.
    */
    navigate("/cart", {
      state: {
        productId: product._id,
        quantity,
        size: selectedSize,
        color: selectedColor,
      },
    });
  };

  if (loading) {
    return (
      <main className="pd-message">
        <div className="pd-spinner" />
        <p>Product details load ho rahi hain...</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="pd-message">
        <h2>Product nahi mila 😔</h2>
        <p>{error || "Ye product abhi available nahi hai."}</p>
        <button onClick={() => navigate("/")}>Shop Now</button>
      </main>
    );
  }

  return (
    <main className="pd-page">
      <div className="pd-breadcrumb">
        <button onClick={() => navigate("/")}>Home</button>
        <span>/</span>
        <span>{product.category || "Collection"}</span>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <section className="pd-layout">
        <div className="pd-gallery">
        {/* Main Product Image */}
        <div className="pd-main-image">
    {images.length > 0 ? (
      <img
        src={images[activeImage]}
        alt={product.name}
        onError={(event) => {
          event.currentTarget.style.visibility = "hidden";
        }}
      />
    ) : (
      <div className="pd-no-image">Image not available</div>
    )}
  </div>

  {/* Product Image Thumbnails */}
  {images.length > 1 && (
    <div className="pd-thumbnails">
      {images.map((image, index) => (
        <button
          key={`${image}-${index}`}
          className={activeImage === index ? "selected" : ""}
          onClick={() => setActiveImage(index)}
          aria-label={`View image ${index + 1}`}
        >
          <img src={image} alt={`${product.name} ${index + 1}`} />
        </button>
      ))}
    </div>
  )}

  {/* Product Video / Reel */}
  {product.video?.url && (
    <div className="pd-product-video">
      <h3>Product Video 🎬</h3>

      <video
        src={product.video.url}
        controls
        playsInline
        preload="metadata"
        className="pd-video-player"
      >
        Your browser does not support video playback.
      </video>
    </div>
  )}
</div>

        <div className="pd-info">
          <span className="pd-category">
            {product.category || "Rajlaxmi Collection"}
          </span>

          <h1>{product.name}</h1>

          {product.description && (
            <p className="pd-description">{product.description}</p>
          )}

          <div className="pd-prices">
            <strong>₹{price.toLocaleString("en-IN")}</strong>

            {originalPrice > price && (
              <>
                <del>₹{originalPrice.toLocaleString("en-IN")}</del>
                <span className="pd-discount">
                  {Math.round(
                    ((originalPrice - price) / originalPrice) * 100
                  )}
                  % OFF
                </span>
              </>
            )}
          </div>

          <p className={stock > 0 ? "pd-in-stock" : "pd-out-stock"}>
            {stock > 0 ? `${stock} available in stock` : "Out of stock"}
          </p>

          {sizes.length > 0 && (
            <div className="pd-option">
              <h3>Select Size</h3>
              <div className="pd-option-list">
                {sizes.map((size) => (
                  <button
                    key={size}
                    className={selectedSize === size ? "selected" : ""}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="pd-option">
              <h3>Select Colour</h3>
              <div className="pd-option-list">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={selectedColor === color ? "selected" : ""}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pd-quantity">
            <h3>Quantity</h3>
            <div>
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                disabled={quantity >= stock}
              >
                +
              </button>
            </div>
          </div>

          <button
            className="pd-add-button"
            onClick={addToCart}
            disabled={stock < 1}
          >
            {stock > 0 ? "ADD TO CART" : "OUT OF STOCK"}
          </button>

          <button
            className="pd-back-button"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>

          <div className="pd-note">
            ✨ Discover beautiful styles from Rajlaxmi Boutique.
          </div>
        </div>
      </section>
    </main>
  );
}

export default ProductDetails;
