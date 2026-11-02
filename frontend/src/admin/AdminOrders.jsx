import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./AdminOrders.css";

const STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const AdminOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders/admin/all");

      if (response.data.success) {
        setOrders(response.data.orders || []);
      } else {
        setError("Orders load nahi ho paaye.");
      }
    } catch (err) {
      console.error("Admin Orders Error:", err.response?.data || err.message);

      setError(
        err.response?.data?.message ||
          "Orders load nahi ho paaye. Admin login aur backend check karo."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let user = null;

    try {
      user = JSON.parse(localStorage.getItem("user"));
    } catch {
      user = null;
    }

    const token = localStorage.getItem("token");

    if (!token || user?.role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    loadOrders();
  }, [navigate, loadOrders]);

  const updateStatus = async (orderId, newStatus) => {
    const currentOrder = orders.find((order) => order._id === orderId);

    if (!currentOrder || currentOrder.orderStatus === newStatus) {
      return;
    }

    if (["CANCELLED", "DELIVERED"].includes(currentOrder.orderStatus)) {
      alert("Cancelled ya delivered order ko update nahi kar sakte.");
      return;
    }

    const confirmed = window.confirm(
      `Order status ${newStatus} karna hai?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(orderId);

      const response = await api.put(`/orders/admin/${orderId}/status`, {
        orderStatus: newStatus,
      });

      if (response.data.success) {
        setOrders((previousOrders) =>
          previousOrders.map((order) =>
            order._id === orderId
              ? { ...order, ...response.data.order }
              : order
          )
        );

        if (selectedOrder?._id === orderId) {
          setSelectedOrder((previous) => ({
            ...previous,
            ...response.data.order,
          }));
        }

        alert("Order status successfully update ho gaya!");
      }
    } catch (err) {
      console.error("Status Update Error:", err.response?.data || err.message);

      alert(
        err.response?.data?.message || "Order status update nahi ho paaya."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) =>
    String(status || "PLACED").toLowerCase();

  const filteredOrders = orders.filter((order) => {
    const customerName =
      order.user?.name || order.shippingAddress?.fullName || "";

    const email = order.user?.email || "";
    const orderId = order._id || "";

    const matchesSearch = [
      customerName,
      email,
      orderId,
      order.shippingAddress?.phone || "",
    ].some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase().trim())
    );

    const matchesStatus =
      statusFilter === "ALL" || order.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getCustomerName = (order) =>
    order.user?.name || order.shippingAddress?.fullName || "Customer";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-orders-layout">
      <aside className="admin-orders-sidebar">
        <div className="admin-orders-brand">
          <div className="admin-orders-brand-icon">❀</div>
          <div>
            <h2>RAJLAXMI</h2>
            <span>B O U T I Q U E</span>
          </div>
        </div>

        <div className="admin-orders-profile">
          <div className="admin-orders-avatar">A</div>
          <div>
            <strong>Rajlaxmi Admin</strong>
            <span>Administrator</span>
          </div>
        </div>

        <p className="admin-orders-menu-label">MAIN MENU</p>

        <nav className="admin-orders-menu">
          <button onClick={() => navigate("/admin")}>
            <span>▦</span> Dashboard
          </button>

          <button className="active">
            <span>📦</span> Orders
          </button>

          <button onClick={() => navigate("/admin/products")}>
            <span>🛍️</span> Products
          </button>
        </nav>

        <div className="admin-orders-sidebar-bottom">
          <button onClick={() => navigate("/")}>
            <span>🏠</span> Visit Store
          </button>

          <button onClick={handleLogout}>
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      <main className="admin-orders-main">
        <header className="admin-orders-header">
          <div>
            <p className="admin-orders-breadcrumb">Admin / Orders</p>
            <h1>Order Management</h1>
            <p className="admin-orders-subtitle">
              Manage customer orders and delivery status.
            </p>
          </div>

          <button
            className="admin-orders-refresh"
            onClick={loadOrders}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </header>

        <section className="admin-orders-summary">
          <article>
            <span>Total Orders</span>
            <strong>{orders.length}</strong>
          </article>

          <article>
            <span>Placed</span>
            <strong>
              {orders.filter((o) => o.orderStatus === "PLACED").length}
            </strong>
          </article>

          <article>
            <span>Shipped</span>
            <strong>
              {orders.filter((o) => o.orderStatus === "SHIPPED").length}
            </strong>
          </article>

          <article>
            <span>Delivered</span>
            <strong>
              {orders.filter((o) => o.orderStatus === "DELIVERED").length}
            </strong>
          </article>
        </section>

        <section className="admin-orders-panel">
          <div className="admin-orders-panel-heading">
            <div>
              <h2>All Orders</h2>
              <p>{filteredOrders.length} orders found</p>
            </div>
          </div>

          <div className="admin-orders-toolbar">
            <input
              type="search"
              placeholder="Search by customer, email, phone or order ID..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All Statuses</option>
              {STATUSES.map((status) => (
                <option value={status} key={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="admin-orders-error">
              {error}
              <button onClick={loadOrders}>Retry</button>
            </div>
          )}

          {loading ? (
            <div className="admin-orders-loading">
              <div className="admin-orders-spinner" />
              <p>Loading orders...</p>
            </div>
          ) : (
            <div className="admin-orders-table-wrap">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>CUSTOMER</th>
                    <th>DATE</th>
                    <th>AMOUNT</th>
                    <th>PAYMENT</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const terminal = ["CANCELLED", "DELIVERED"].includes(
                        order.orderStatus
                      );

                      return (
                        <tr key={order._id}>
                          <td>
                            <strong className="admin-orders-id">
                              #{String(order._id).slice(-6).toUpperCase()}
                            </strong>
                          </td>

                          <td>
                            <div className="admin-orders-customer">
                              <strong>{getCustomerName(order)}</strong>
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
                            <div className="admin-orders-payment">
                              <strong>{order.paymentMethod || "—"}</strong>
                              <span>
                                {order.paymentStatus || "PENDING"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`admin-orders-status ${getStatusClass(
                                order.orderStatus
                              )}`}
                            >
                              {order.orderStatus || "PLACED"}
                            </span>
                          </td>

                          <td>
                            <div className="admin-orders-actions">
                              <button
                                className="admin-orders-details-btn"
                                onClick={() => setSelectedOrder(order)}
                              >
                                Details
                              </button>

                              <select
                                aria-label={`Update status for order ${order._id}`}
                                value={order.orderStatus}
                                disabled={terminal || updatingId === order._id}
                                onChange={(event) =>
                                  updateStatus(order._id, event.target.value)
                                }
                              >
                                <option value={order.orderStatus}>
                                  {updatingId === order._id
                                    ? "Updating..."
                                    : order.orderStatus}
                                </option>

                                {STATUSES.filter(
                                  (status) =>
                                    status !== order.orderStatus &&
                                    status !== "PLACED"
                                ).map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="admin-orders-empty">
                        {orders.length
                          ? "No orders match your search or filter."
                          : "No customer orders found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="admin-orders-footer">
          © {new Date().getFullYear()} Rajlaxmi Boutique · Admin Panel
        </footer>
      </main>

      {selectedOrder && (
        <div
          className="admin-order-modal-backdrop"
          onClick={() => setSelectedOrder(null)}
        >
          <section
            className="admin-order-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Order details"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-order-modal-header">
              <div>
                <p>ORDER DETAILS</p>
                <h2>
                  #{String(selectedOrder._id).slice(-6).toUpperCase()}
                </h2>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
              >
                ×
              </button>
            </div>

            <div className="admin-order-modal-body">
              <div className="admin-order-detail-row">
                <span>Customer</span>
                <strong>{getCustomerName(selectedOrder)}</strong>
              </div>

              <div className="admin-order-detail-row">
                <span>Email</span>
                <strong>{selectedOrder.user?.email || "—"}</strong>
              </div>

              <div className="admin-order-detail-row">
                <span>Order Date</span>
                <strong>{formatDate(selectedOrder.createdAt)}</strong>
              </div>

              <div className="admin-order-detail-row">
                <span>Order Status</span>
                <strong>{selectedOrder.orderStatus}</strong>
              </div>

              <div className="admin-order-detail-row">
                <span>Payment Method</span>
                <strong>{selectedOrder.paymentMethod || "—"}</strong>
              </div>

              <div className="admin-order-detail-row">
                <span>Payment Status</span>
                <strong>{selectedOrder.paymentStatus || "PENDING"}</strong>
              </div>

              <h3>Delivery Address</h3>

              <div className="admin-order-address">
                {selectedOrder.shippingAddress ? (
                  <>
                    <strong>
                      {selectedOrder.shippingAddress.fullName || "—"}
                    </strong>
                    <p>{selectedOrder.shippingAddress.phone || "—"}</p>
                    <p>{selectedOrder.shippingAddress.address || "—"}</p>
                    <p>
                      {[
                        selectedOrder.shippingAddress.city,
                        selectedOrder.shippingAddress.state,
                        selectedOrder.shippingAddress.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </>
                ) : (
                  <p>Delivery address not available.</p>
                )}
              </div>

              <h3>Products</h3>

              <div className="admin-order-products">
                {selectedOrder.items?.length ? (
                  selectedOrder.items.map((item, index) => (
                    <div
                      className="admin-order-product"
                      key={item._id || `${item.product}-${index}`}
                    >
                      <div>
                        <strong>{item.name || "Product"}</strong>
                        <span>
                          Qty: {item.quantity || 1}
                          {item.size ? ` · Size: ${item.size}` : ""}
                          {item.color ? ` · Color: ${item.color}` : ""}
                        </span>
                      </div>

                      <strong>
                        {formatCurrency(
                          (Number(item.price) || 0) *
                            (Number(item.quantity) || 1)
                        )}
                      </strong>
                    </div>
                  ))
                ) : (
                  <p>Product details not available.</p>
                )}
              </div>

              <div className="admin-order-total">
                <span>Total Amount</span>
                <strong>
                  {formatCurrency(selectedOrder.totalAmount)}
                </strong>
              </div>

              <button
                className="admin-order-close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                Close Details
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;