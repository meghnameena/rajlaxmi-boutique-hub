import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Wishlist from "./Wishlist";
import api from "./api/axios";
import "./App.css";
import MyOrders from "./MyOrders";
import OrderDetails from "./OrderDetails";
import AIAssistant from "./components/AIAssistant";
import Cart from "./Cart";
import AdminProducts from "./admin/AdminProducts";
import AdminDashboard from "./admin/AdminDashboard";
import Checkout from "./Checkout";
import AdminOrders from "./admin/AdminOrders";
import OrderSuccess from "./OrderSuccess";
import ProductDetails from "./pages/ProductDetails";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import {
  FaSearch,
  FaRegHeart,
  FaShoppingBag,
  FaUser,
  FaTruck,
  FaShieldAlt,
  FaBoxOpen,
  FaHeadset,
  FaStar,
  FaBars,
  FaTimes,
  FaArrowRight,
} from "react-icons/fa";

const categories = [
  {
    name: "Sarees",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Suits",
    image:
      "https://images.unsplash.com/photo-1583391733956-6c78276477e4?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Kurtis",
    image:
      "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Lehengas",
    image:
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Dresses",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=400&q=80",
  },
];

const fallbackProductImage =
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80";

const benefits = [
  {
    icon: <FaTruck />,
    title: "Free Shipping",
    subtitle: "On orders above ₹999",
  },
  {
    icon: <FaShieldAlt />,
    title: "Secure Shopping",
    subtitle: "Safe shopping experience",
  },
  {
    icon: <FaBoxOpen />,
    title: "Easy Returns",
    subtitle: "Hassle-free assistance",
  },
  {
    icon: <FaHeadset />,
    title: "Customer Support",
    subtitle: "We're here to help",
  },
];

function HomePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError("");

        const response = await fetch("http://localhost:5000/api/products");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Products load nahi ho paaye.");
        }
        const activeProducts = (data.products || [])
          .filter((product) => product.status === "active" && product.stock > 0)
          .map((product) => {
            const originalPrice = Number(product.price) || 0;
            const sellingPrice =
              product.salePrice != null && Number(product.salePrice) < originalPrice
                ? Number(product.salePrice)
                : originalPrice;

            return {
              ...product,
              id: product._id,
              price: sellingPrice,
              oldPrice: sellingPrice < originalPrice ? originalPrice : null,
              discount:
                sellingPrice < originalPrice && originalPrice > 0
                  ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
                  : 0,
              image: product.images?.find(Boolean) || fallbackProductImage,
            };
          });

        setProducts(activeProducts);
      } catch (error) {
        console.error("Fetch Products Error:", error);
        setProductsError(
          "Products load nahi ho paaye. Backend server check karke page refresh karein."
        );
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("wishlist")) || [];
  } catch {
    return [];
  }
});
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredProducts = products.filter((product) => {
  const productName = (product.name || "").toLowerCase();
  const productCategory = (product.category || "").toLowerCase();
  const searchText = search.toLowerCase().trim();

  const matchesSearch =
    productName.includes(searchText) ||
    productCategory.includes(searchText);

  const categoryMap = {
    Sarees: ["saree", "sarees", "rajwadi style"],
    Suits: ["suit", "suits", "salwar"],
    Kurtis: ["kurti", "kurtis"],
    Lehengas: ["lehenga", "lehengas"],
    Dresses: ["dress", "dresses", "western"],
  };

  const matchesCategory =
    activeCategory === "All" ||
    (categoryMap[activeCategory] || [activeCategory.toLowerCase()])
      .some((keyword) =>
        productName.includes(keyword) ||
        productCategory.includes(keyword)
      );

  return matchesSearch && matchesCategory;
});

  // Load the logged-in user's saved cart from the backend
  useEffect(() => {
    const loadCart = async () => {
      if (!localStorage.getItem("token")) {
        setCart([]);
        return;
      }

      try {
        const response = await api.get("/cart");
        if (response.data.success) {
          setCart(response.data.cart?.items || []);
        }
      } catch (error) {
        console.error("Load Cart Error:", error.response?.data || error.message);
      }
    };

    loadCart();
  }, [user]);

  // Add product to backend cart
const addToCart = async (product) => {
  if (!localStorage.getItem("token")) {
    setShowLoginPopup(true);
    return;
  }

  try {
    const response = await api.post("/cart/add", {
      productId: product._id || product.id,
      quantity: 1,
    });

    if (response.data.success) {
      setCart(response.data.cart?.items || []);
      navigate("/cart");
    }
  } catch (error) {
    console.error(
      "Add To Cart Error:",
      error.response?.data || error.message
    );

    alert(
      error.response?.data?.message ||
      "Unable to add product to bag. Please try again."
    );
  }
};

  const cartCount = cart.reduce(
    (total, item) => total + (Number(item.quantity) || 1),
    0
  );

  const toggleWishlist = (productId) => {
  setWishlist((previousWishlist) => {
    const updatedWishlist = previousWishlist.includes(productId)
      ? previousWishlist.filter((id) => id !== productId)
      : [...previousWishlist, productId];

    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));

    return updatedWishlist;
  });
};

  const scrollToProducts = () => {
    document
      .getElementById("products")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="boutique-app">
      {/* Top announcement bar */}
      <div className="top-bar">
        <div className="container-fluid top-bar-inner">
          <span>✦ Free Shipping on Orders Above ₹999</span>
          
          <span className="top-center">
            ✨ Authentic Collection | Timeless Style
          </span>
          <span>✆ Customer Care</span>
        </div>
      </div>

      {/* Navigation */}
      <header className="main-header">
        <div className="container-fluid header-inner">
          <a href="#home" className="brand">
            <span className="brand-symbol">❀</span>
            <span>
              <strong>RAJLAXMI</strong>
              <small>B O U T I Q U E</small>
            </span>
          </a>

          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
           
          <nav className={`navigation ${menuOpen ? "open" : ""}`}>
            <a href="#home" onClick={() => setMenuOpen(false)}>
              Home
            </a>
            <a
              href="#products"
              onClick={() => {
                setActiveCategory("All");
                setMenuOpen(false);
              }}
            >
              Shop
            </a>

            {categories.map((category) => (
              <a
                href="#products"
                key={category.name}
                onClick={() => {
                  setActiveCategory(category.name);
                  setMenuOpen(false);
                }}
              >
                {category.name}
              </a>
            ))}

            <a href="#about" onClick={() => setMenuOpen(false)}>
              About
            </a>
          </nav>

         <form
          className="search-box"
          onSubmit={(event) => event.preventDefault()}
        >
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);

              document.getElementById("products")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            aria-label="Search products"
          />

          <button type="submit" aria-label="Search">
            <FaSearch />
          </button>
        </form>

          <div className="header-actions">
            {user ? (
              <>
                <span className="account-name" title={user.email || "Account"}>
                  Hi, {user.name?.split(" ")[0] || "User"}
                </span>
                <button
                  className="icon-button logout-button"
                  title="Logout"
                  onClick={handleLogout}
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                className="icon-button"
                title="Login / Account"
                onClick={() => navigate("/login")}
                type="button"
              >
                <FaUser />
              </button>
            )}

           <button
            className="icon-button"
            title="Wishlist"
            onClick={() => navigate("/wishlist")}
            type="button"
          >
            <FaRegHeart />
            {wishlist.length > 0 && (
              <span className="count-badge">{wishlist.length}</span>
            )}
          </button>

            <button
              className="icon-button"
              title="Shopping bag"
              onClick={() => navigate("/cart")}
            >
              <FaShoppingBag />
              <span className="count-badge">{cartCount}</span>
            </button>

            <button
            type="button"
            className="my-orders-btn"
            onClick={() => navigate("/my-orders")}
          >
            My Orders
          </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero banner */}
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">THE NEW COLLECTION</span>

            <h1>
              Elegance
              <br />
              In Every Drape
            </h1>

            <div className="hero-divider">✧ ───── ❀ ───── ✧</div>

            <p>Sarees | Suits | Kurtis | Lehengas | Dresses</p>

            <button className="primary-button" onClick={scrollToProducts}>
              Explore Collection <FaArrowRight />
            </button>

            <small className="hero-note">
              Celebrate every moment in style.
            </small>
          </div>
        </section>

        {/* Categories */}
        <section className="categories-section section-container">
          <div className="section-heading">
            <span className="eyebrow">EXPLORE OUR COLLECTION</span>
            <h2>Shop By Category</h2>
            <div className="heading-decoration">✧ ── ❀ ── ✧</div>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <button
                className={`category-card ${
                  activeCategory === category.name ? "selected" : ""
                }`}
                key={category.name}
                onClick={() => {
                  setActiveCategory(category.name);
                  scrollToProducts();
                }}
              >
                <div className="category-image">
                  <img src={category.image} alt={category.name} />
                </div>
                <h3>{category.name}</h3>
                <span>Discover More ↗</span>
              </button>
            ))}
          </div>
        </section>

        {/* Shopping benefits */}
        <section className="benefits-section section-container">
          {benefits.map((benefit) => (
            <div className="benefit-card" key={benefit.title}>
              <div className="benefit-icon">{benefit.icon}</div>
              <div>
                <h4>{benefit.title}</h4>
                <p>{benefit.subtitle}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Products */}
        <section className="products-section section-container" id="products">
          <div className="products-heading">
            <div className="section-heading">
              <span className="eyebrow">HANDPICKED FOR YOU</span>
              <h2>Our Featured Collection</h2>
              <div className="heading-decoration">✧ ── ❀ ── ✧</div>
            </div>
          </div>

          <div className="filter-bar">
            {["All", ...categories.map((category) => category.name)].map(
              (category) => (
                <button
                  key={category}
                  className={
                    activeCategory === category ? "filter active" : "filter"
                  }
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              )
            )}
          </div>

          <div className="product-grid">
            {productsLoading ? (
              <div className="empty-state">
                <h3>Loading collection...</h3>
                <p>Please wait while we fetch the latest products.</p>
              </div>
            ) : productsError ? (
              <div className="empty-state">
                <h3>Unable to load products</h3>
                <p>{productsError}</p>
                <button
                  className="primary-button"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            ) : filteredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image-wrap">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image"
                      loading="lazy"
                      onClick={() => navigate(`/product/${product._id || product.id}`)}
                      style={{ cursor: "pointer" }}
                    />

                    {product.discount > 0 && (
                      <span className="discount-badge">
                        {product.discount}% OFF
                      </span>
                    )}

                    <button
                      className={`wishlist-button ${
                        wishlist.includes(product.id) ? "wishlisted" : ""
                      }`}
                      onClick={() => toggleWishlist(product.id)}
                      aria-label={`Toggle wishlist for ${product.name}`}
                    >
                      <FaRegHeart />
                    </button>
                  </div>

                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3 onClick={() => navigate(`/product/${product._id || product.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {product.name}
                </h3>

                  {product.rating && (
                    <div className="product-rating">
                      <FaStar />
                      <strong>{product.rating}</strong>
                      {product.reviews != null && (
                        <span>({product.reviews} reviews)</span>
                      )}
                    </div>
                  )}

                  <p className="product-stock">
                  {product.stock <= 5
                    ? product.stock === 1
                      ? "Only 1 left"
                      : `Only ${product.stock} left`
                    : "\u00A0"}
                </p>

                  <div className="product-prices">
                    <strong>
                      ₹{product.price.toLocaleString("en-IN")}
                    </strong>
                    {product.oldPrice != null && (
                      <del>₹{product.oldPrice.toLocaleString("en-IN")}</del>
                    )}
                  </div>

                  <button
                    className="add-cart-button"
                    onClick={() => addToCart(product)}
                  >
                    <FaShoppingBag /> Add to Bag
                  </button>
                </div>
              </article>
            ))}
          </div>

          {!productsLoading && !productsError && filteredProducts.length === 0 && (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Try another search or select a different category.</p>
              <button className="primary-button" onClick={() => { setSearch("");
                  setActiveCategory("All"); }}>
                View All Products
              </button>
            </div>
          )}
        </section>

        {/* Festive collection */}
        <section className="festive-banner">
          <div className="festive-content">
            <span className="eyebrow">MADE FOR YOUR SPECIAL MOMENTS</span>
            <h2>The Festive Edit</h2>
            <p>Beautiful outfits for celebrations, weddings and beyond.</p>
            <button className="primary-button" onClick={scrollToProducts}>
              Discover the Collection <FaArrowRight />
            </button>
          </div>
        </section>

        {/* About */}
        
      {/* About */}
<section className="about-section section-container" id="about">
  <div className="about-content">
    <span className="eyebrow">OUR STORY</span>
    <h2>Tradition Meets Timeless Elegance</h2>
    <div className="about-decoration">✧ ── ❀ ── ✧</div>

    <p>
      Welcome to Rajlaxmi Boutique, where traditional Indian fashion
      meets timeless elegance. Discover beautiful sarees, suits, kurtis,
      lehengas and dresses thoughtfully selected for your special moments.
    </p>

    <p>
      From festive celebrations to weddings and everyday elegance,
      find styles that reflect your personality and make every occasion
      memorable.
    </p>

    <a href="#products" className="text-link">
      Explore our collection <FaArrowRight />
    </a>
  </div>

  {/* Boutique Location */}
  <div className="boutique-location">
  <div className="location-heading">
    <span className="eyebrow">FIND US</span>
    <h2>Visit Our Boutique</h2>
    <p>We would love to welcome you at Rajlaxmi Boutique!</p>
  </div>

  <div
  className="boutique-photo"
  style={{
    width: "min(1100px, calc(100vw - 48px))",
    height: "280px",
    marginLeft: "50%",
    transform: "translateX(-50%)",
    overflow: "hidden",
    borderRadius: "14px",
  }}
>
  <img
    src="/rajlaxmi-board.png"
    alt="Rajlaxmi Boutique"
    style={{
      width: "100%",
      height: "100%",
      display: "block",
      objectFit: "cover",
      objectPosition: "center 75%",
    }}
  />
</div>

 <a
  href="https://www.google.com/maps/dir/?api=1&destination=25.1403640741348,75.83072033325678"
  target="_blank"
  rel="noopener noreferrer"
  style={{
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginTop: "24px",
    padding: "13px 30px",
    background: "linear-gradient(135deg, #8b5e16, #d4af37, #f5df91)",
    color: "#3b1721",
    border: "1px solid #d4af37",
    borderRadius: "50px",
    fontWeight: "700",
    fontSize: "15px",
    textDecoration: "none",
    boxShadow: "0 5px 15px rgba(139, 94, 22, 0.25)",
    cursor: "pointer"
  }}
>
  Get Directions <FaArrowRight />
</a>
</div>
</section>

      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-main section-container">
          <div className="footer-brand">
            <a href="#home" className="brand">
              <span className="brand-symbol">❀</span>
              <span>
                <strong>RAJLAXMI</strong>
                <small>B O U T I Q U E</small>
              </span>
            </a>
            <p>
              Ethnic elegance, thoughtfully selected for your most beautiful
              moments.
            </p>
          </div>

          <div className="footer-column">
            <h4>Quick Links</h4>
            <a href="#home">Home</a>
            <a href="#products">Shop Collection</a>
            <a href="#about">Our Story</a>
          </div>
          

          <div className="footer-column">
            <h4>Shop Categories</h4>
            {categories.map((category) => (
              <a
                href="#products"
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
              >
                {category.name}
              </a>
            ))}
          </div>

          <div className="footer-column">
            <h4>Customer Care</h4>
            <p>Need help with your order?</p>
            <p>Contact our boutique for assistance.</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Rajlaxmi Boutique. All rights
            reserved.
          </p>
          <p>Designed with elegance ♥</p>
        </div>
      </footer>
      
       {showLoginPopup && (
        <div className="login-popup-overlay">
          <div className="login-popup-card">
            <div className="login-popup-icon">🛍️</div>

            <h2>Welcome to Rajlaxmi</h2>

            <div className="popup-divider">✦ ── ❀ ── ✦</div>

            <p>
              Please login to add your favourite products
              to your shopping bag.
            </p>

            <button
              className="popup-login-btn"
              onClick={() => navigate("/login")}
            >
              Login Now
            </button>

            <button
              className="popup-close-btn"
              onClick={() => setShowLoginPopup(false)}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
   


function App() {
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wishlist")) || [];
    } catch {
      return [];
    }
  });

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              products={products}
              setProducts={setProducts}
              wishlist={wishlist}
              setWishlist={setWishlist}
            />
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/product/:id"
          element={<ProductDetails />}
        />

        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/my-orders/:orderId" element={<OrderDetails />} />
        <Route path="/admin" element={<AdminDashboard />} />

        <Route
          path="/wishlist"
          element={
            <Wishlist
              products={products}
              wishlist={wishlist}
              setWishlist={setWishlist}
            />
          }
        />
      </Routes>

      <AIAssistant />
    </>
  );
}

export default App;