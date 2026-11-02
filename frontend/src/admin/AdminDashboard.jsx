import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalProducts: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      const token = localStorage.getItem("token");

      let user = null;

      try {
        user = JSON.parse(localStorage.getItem("user"));
      } catch {
        user = null;
      }

      if (!token || user?.role !== "admin") {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [statsResponse, ordersResponse, stockResponse] =
          await Promise.all([
            api.get("/dashboard/stats"),
            api.get("/dashboard/recent-orders"),
            api.get("/dashboard/low-stock"),
          ]);

        if (statsResponse.data.success) {
          setStats(statsResponse.data.dashboard);
        }

        if (ordersResponse.data.success) {
          setRecentOrders(ordersResponse.data.orders || []);
        }

        if (stockResponse.data.success) {
          setLowStockProducts(stockResponse.data.products || []);
        }
      } catch (err) {
        console.error(
          "Admin Dashboard Error:",
          err.response?.data || err.message
        );

        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          setError(
            "Admin access denied. Please login using your admin account."
          );
        } else {
          setError(
            err.response?.data?.message ||
              "Dashboard data load nahi ho paaya. Backend server check karo."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) =>
    String(status || "PLACED").toLowerCase().replace(/\s+/g, "-");

  const cards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: "📦",
      className: "purple",
    },
    {
      title: "Total Sales",
      value: formatCurrency(stats.totalSales),
      icon: "₹",
      className: "pink",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: "🛍️",
      className: "orange",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: "⏳",
      className: "blue",
    },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">❀</div>
          <div>
            <h2>RAJLAXMI</h2>
            <span>B O U T I Q U E</span>
          </div>
        </div>

        <div className="admin-profile">
          <div className="admin-avatar">A</div>
          <div>
            <strong>Rajlaxmi Admin</strong>
            <span>Administrator</span>
          </div>
        </div>

        <p className="admin-menu-label">MAIN MENU</p>

        <nav className="admin-menu">
          <button
            className="admin-menu-item active"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <span>▦</span> Dashboard
          </button>

          <button
            className="admin-menu-item"
            onClick={() => navigate("/admin/orders")}
          >
            <span>📦</span> Orders
          </button>

          <button
            className="admin-menu-item"
            onClick={() => navigate("/admin/products")}
          >
            <span>🛍️</span> Products
          </button>

          <button
            className="admin-menu-item"
            onClick={() =>
              document
                .getElementById("low-stock-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>⚠️</span> Low Stock
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            className="admin-menu-item"
            onClick={() => navigate("/")}
          >
            <span>🏠</span> Visit Store
          </button>

          <button
            className="admin-menu-item admin-logout"
            onClick={handleLogout}
          >
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-breadcrumb">Admin / Dashboard</p>
            <h1>Dashboard Overview</h1>
            <p className="admin-welcome">
              Welcome back! Here's what's happening in your boutique.
            </p>
          </div>

          <button
            className="admin-store-button"
            onClick={() => navigate("/")}
          >
            ↗ View Store
          </button>
        </header>

        {error && (
          <div className="admin-error">
            <span>{error}</span>
            <button onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner" />
            <p>Loading your dashboard...</p>
          </div>
        ) : (
          <>
            <section className="admin-stats-grid">
              {cards.map((card) => (
                <article
                  className="admin-stat-card"
                  key={card.title}
                >
                  <div className="admin-stat-top">
                    <span>{card.title}</span>
                    <div
                      className={`admin-stat-icon ${card.className}`}
                    >
                      {card.icon}
                    </div>
                  </div>

                  <h2>{card.value}</h2>

                  <p className="admin-stat-caption">
                    Live store overview
                  </p>
                </article>
              ))}
            </section>

            <section className="admin-status-grid">
              <article className="admin-status-card">
                <span className="status-dot pending-dot" />
                <div>
                  <p>Placed Orders</p>
                  <h3>{stats.pendingOrders}</h3>
                </div>
              </article>

              <article className="admin-status-card">
                <span className="status-dot shipped-dot" />
                <div>
                  <p>Shipped Orders</p>
                  <h3>{stats.shippedOrders}</h3>
                </div>
              </article>

              <article className="admin-status-card">
                <span className="status-dot delivered-dot" />
                <div>
                  <p>Delivered Orders</p>
                  <h3>{stats.deliveredOrders}</h3>
                </div>
              </article>

              <article className="admin-status-card">
                <span className="status-dot cancelled-dot" />
                <div>
                  <p>Cancelled Orders</p>
                  <h3>{stats.cancelledOrders}</h3>
                </div>
              </article>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Recent Orders</h2>
                  <p>Your latest customer orders</p>
                </div>

                <button
                  className="admin-view-all"
                  onClick={() => navigate("/admin/orders")}
                >
                  View All →
                </button>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ORDER</th>
                      <th>CUSTOMER</th>
                      <th>DATE</th>
                      <th>AMOUNT</th>
                      <th>PAYMENT</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <tr key={order._id}>
                          <td>
                            <strong>
                              #{String(order._id).slice(-6).toUpperCase()}
                            </strong>
                          </td>

                          <td>
                            <div className="admin-customer">
                              <strong>
                                {order.user?.name || "Customer"}
                              </strong>
                              <span>{order.user?.email || "—"}</span>
                            </div>
                          </td>

                          <td>{formatDate(order.createdAt)}</td>

                          <td>
                            <strong>
                              {formatCurrency(order.totalAmount)}
                            </strong>
                          </td>

                          <td>
                            <div className="admin-payment">
                              <span>{order.paymentMethod || "—"}</span>
                              <small>
                                {order.paymentStatus || "PENDING"}
                              </small>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`admin-status-badge ${getStatusClass(
                                order.orderStatus
                              )}`}
                            >
                              {order.orderStatus || "PLACED"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="admin-empty">
                          No orders found yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section
              className="admin-panel"
              id="low-stock-section"
            >
              <div className="admin-panel-heading">
                <div>
                  <h2>Low Stock Alerts</h2>
                  <p>Products with 5 or fewer items remaining</p>
                </div>

                <span className="admin-alert-count">
                  {lowStockProducts.length} Products
                </span>
              </div>

              {lowStockProducts.length > 0 ? (
                <div className="admin-stock-list">
                  {lowStockProducts.map((product) => (
                    <div
                      className="admin-stock-item"
                      key={product._id}
                    >
                      <div className="admin-stock-product">
                        <div className="admin-stock-image">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                            />
                          ) : (
                            <span>🛍️</span>
                          )}
                        </div>

                        <div>
                          <strong>{product.name}</strong>
                          <span>
                            {product.category || "Uncategorized"}
                          </span>
                        </div>
                      </div>

                      <div className="admin-stock-price">
                        {formatCurrency(
                          product.salePrice ?? product.price
                        )}
                      </div>

                      <span
                        className={`admin-stock-badge ${
                          Number(product.stock) === 0
                            ? "out-of-stock"
                            : "low-stock"
                        }`}
                      >
                        {product.stock} left
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-stock-empty">
                  <span>✓</span>
                  <p>All active products have sufficient stock.</p>
                </div>
              )}
            </section>

            <footer className="admin-footer">
              © {new Date().getFullYear()} Rajlaxmi Boutique · Admin Panel
            </footer>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;