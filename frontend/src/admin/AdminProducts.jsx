import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./AdminProducts.css";

const EMPTY_FORM = {
  name: "",
  category: "",
  description: "",
  price: "",
  salePrice: "",
  stock: "0",
  sku: "",
  sizes: "",
  colors: "",
  images: "",
  videoUrl: "",
  videoPublicId: "",
};

const AdminProducts = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");

      if (response.data.success) {
        setProducts(response.data.products || []);
      } else {
        setError("Products load nahi ho paaye.");
      }
    } catch (err) {
      console.error("Load Products Error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Products load nahi ho paaye."
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

    if (!localStorage.getItem("token") || user?.role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    loadProducts();
  }, [navigate, loadProducts]);

  const categories = [
    ...new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
    ),
  ];

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const getProductImage = (product) => {
    if (Array.isArray(product.images)) {
      return product.images.find(
        (image) => typeof image === "string" && image.trim()
      );
    }

    return "";
  };

  const getStockStatus = (product) => {
    const stock = Number(product.stock) || 0;

    if (stock === 0 || product.status === "out_of_stock") {
      return { label: "Out of Stock", className: "out" };
    }

    if (stock <= 5) {
      return { label: "Low Stock", className: "low" };
    }

    return { label: "In Stock", className: "in" };
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setSelectedFiles([]);
    setSelectedVideo(null);
    setVideoPreview("");
    setModalOpen(true);
  };

  const openEditModal = (product) => {
  setEditingProduct(product);
  setSelectedFiles([]);
  setSelectedVideo(null);
  setVideoPreview("");

  setForm({
    name: product.name || "",
    category: product.category || "",
    description: product.description || "",
    price: String(product.price ?? ""),
    salePrice:
      product.salePrice === undefined || product.salePrice === null
        ? ""
        : String(product.salePrice),
    stock: String(product.stock ?? 0),
    sku: product.sku || "",
    sizes: Array.isArray(product.sizes)
      ? product.sizes.join(", ")
      : "",
    colors: Array.isArray(product.colors)
      ? product.colors.join(", ")
      : "",
    images: Array.isArray(product.images)
      ? product.images.join("\n")
      : "",
    videoUrl: product.video?.url || "",
    videoPublicId: product.video?.publicId || "",
  });

  setModalOpen(true);
};

  const closeModal = () => {
  if (saving || uploadingImages || uploadingVideo) return;

  setModalOpen(false);
  setEditingProduct(null);
  setForm(EMPTY_FORM);
  setSelectedFiles([]);
  setSelectedVideo(null);

  setVideoPreview((previous) => {
    if (previous) URL.revokeObjectURL(previous);
    return "";
  });
};

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  useEffect(() => {
    const previews = selectedFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setImagePreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [selectedFiles]);

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const existingCount = form.images
      .split("\\n")
      .map((url) => url.trim())
      .filter(Boolean).length;

    const remainingSlots = 5 - existingCount - selectedFiles.length;

    if (remainingSlots <= 0 || files.length > remainingSlots) {
      alert("Maximum 5 product images allowed.");
      event.target.value = "";
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const invalidFile = files.find(
      (file) => !validTypes.includes(file.type) || file.size > 5 * 1024 * 1024
    );

    if (invalidFile) {
      alert("Only JPG, PNG, WEBP or GIF images up to 5 MB are allowed.");
      event.target.value = "";
      return;
    }

    setSelectedFiles((previous) => [...previous, ...files]);
    event.target.value = "";
  };


  const handleVideoSelect = (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  const allowedTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];

  if (!allowedTypes.includes(file.type)) {
    alert("Only MP4, WEBM and MOV videos are allowed.");
    event.target.value = "";
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    alert("Video maximum 50 MB ki honi chahiye.");
    event.target.value = "";
    return;
  }

  setSelectedVideo(file);

  setVideoPreview((previous) => {
    if (previous) URL.revokeObjectURL(previous);
    return URL.createObjectURL(file);
  });

  event.target.value = "";
};

  const removeSelectedImage = (index) => {
    setSelectedFiles((previous) => previous.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    const urls = form.images
      .split("\\n")
      .map((url) => url.trim())
      .filter(Boolean);
    urls.splice(index, 1);
    setForm((previous) => ({ ...previous, images: urls.join("\n") }));
  };

  const splitValues = (value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

const handleSubmit = async (event) => {
  event.preventDefault();

  const price = Number(form.price);
  const stock = Number(form.stock);

  const salePrice =
    form.salePrice.trim() === "" ? null : Number(form.salePrice);

  if (!form.name.trim() || !form.category.trim() || !form.sku.trim()) {
    alert("Name, category aur SKU required hain.");
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    alert("Valid product price enter karo.");
    return;
  }

  if (!Number.isInteger(stock) || stock < 0) {
    alert("Stock zero ya positive whole number hona chahiye.");
    return;
  }

  if (
    salePrice !== null &&
    (!Number.isFinite(salePrice) || salePrice < 0)
  ) {
    alert("Valid sale price enter karo.");
    return;
  }

  const images = form.images
    .split("\n")
    .map((image) => image.trim())
    .filter(Boolean);

  try {
    setSaving(true);

    // 1. Upload newly selected product images
    let uploadedImageUrls = [];

    if (selectedFiles.length > 0) {
      setUploadingImages(true);

      try {
        const imageData = new FormData();

        selectedFiles.forEach((file) => {
          imageData.append("images", file);
        });

        const uploadResponse = await api.post(
          "/images/upload-multiple",
          imageData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (
          !uploadResponse.data?.success ||
          !Array.isArray(uploadResponse.data.images)
        ) {
          throw new Error("Cloudinary image upload failed.");
        }

        uploadedImageUrls = uploadResponse.data.images.map(
          (image) => image.url
        );
      } finally {
        setUploadingImages(false);
      }
    }

    // 2. Keep existing video unless a new video is selected
    let videoData = {
      url: form.videoUrl || "",
      publicId: form.videoPublicId || "",
    };

    // 3. Upload a new product video if selected
    if (selectedVideo) {
      setUploadingVideo(true);

      try {
        const videoFormData = new FormData();
        videoFormData.append("video", selectedVideo);

        const videoResponse = await api.post(
          "/images/upload-video",
          videoFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (
          !videoResponse.data?.success ||
          !videoResponse.data.video?.url
        ) {
          throw new Error("Video upload failed.");
        }

        videoData = {
          url: videoResponse.data.video.url,
          publicId: videoResponse.data.video.publicId || "",
        };
      } finally {
        setUploadingVideo(false);
      }
    }

    // 4. Prepare product data
    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      price,
      stock,
      sku: form.sku.trim(),
      sizes: splitValues(form.sizes),
      colors: splitValues(form.colors),
      images: [...images, ...uploadedImageUrls],
      video: videoData,
    };

    if (salePrice !== null) {
      payload.salePrice = salePrice;
    }

    // 5. Add new product or update existing product
    const response = editingProduct
      ? await api.put(`/products/${editingProduct._id}`, payload)
      : await api.post("/products", payload);

    if (response.data.success) {
      alert(
        editingProduct
          ? "Product successfully update ho gaya!"
          : "Product successfully add ho gaya!"
      );

      setModalOpen(false);
      setEditingProduct(null);
      setForm(EMPTY_FORM);
      setSelectedFiles([]);
      setSelectedVideo(null);

      setVideoPreview((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return "";
      });

      await loadProducts();
    } else {
      alert(response.data.message || "Product save nahi ho paaya.");
    }
  } catch (err) {
    console.error(
      "Save Product Error:",
      err.response?.data || err.message
    );

    alert(
      err.response?.data?.message ||
        err.message ||
        "Product save nahi ho paaya. Backend aur validation check karo."
    );
  } finally {
    setSaving(false);
    setUploadingImages(false);
    setUploadingVideo(false);
  }
};


  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `"${product.name}" ko delete karna hai? Ye action undo nahi hoga.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(product._id);

      const response = await api.delete(`/products/${product._id}`);

      if (response.data.success) {
        setProducts((previous) =>
          previous.filter((item) => item._id !== product._id)
        );

        alert("Product delete ho gaya.");
      } else {
        alert(response.data.message || "Product delete nahi ho paaya.");
      }
    } catch (err) {
      console.error("Delete Product Error:", err.response?.data || err.message);

      alert(
        err.response?.data?.message || "Product delete nahi ho paaya."
      );
    } finally {
      setDeletingId("");
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();

    const matchesSearch = [
      product.name,
      product.category,
      product.sku,
    ].some((value) =>
      String(value || "").toLowerCase().includes(query)
    );

    const matchesCategory =
      categoryFilter === "ALL" || product.category === categoryFilter;

    const stock = Number(product.stock) || 0;

    const matchesStock =
      stockFilter === "ALL" ||
      (stockFilter === "LOW" && stock > 0 && stock <= 5) ||
      (stockFilter === "OUT" &&
        (stock === 0 || product.status === "out_of_stock")) ||
      (stockFilter === "IN" && stock > 5);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-products-layout">
      <aside className="admin-products-sidebar">
        <div className="admin-products-brand">
          <div className="admin-products-brand-icon">❀</div>
          <div>
            <h2>RAJLAXMI</h2>
            <span>B O U T I Q U E</span>
          </div>
        </div>

        <div className="admin-products-profile">
          <div className="admin-products-avatar">A</div>
          <div>
            <strong>Rajlaxmi Admin</strong>
            <span>Administrator</span>
          </div>
        </div>

        <p className="admin-products-menu-label">MAIN MENU</p>

        <nav className="admin-products-menu">
          <button onClick={() => navigate("/admin")}>
            <span>▦</span> Dashboard
          </button>

          <button onClick={() => navigate("/admin/orders")}>
            <span>📦</span> Orders
          </button>

          <button className="active">
            <span>🛍️</span> Products
          </button>
        </nav>

        <div className="admin-products-sidebar-bottom">
          <button onClick={() => navigate("/")}>
            <span>🏠</span> Visit Store
          </button>

          <button onClick={handleLogout}>
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      <main className="admin-products-main">
        <header className="admin-products-header">
          <div>
            <p className="admin-products-breadcrumb">Admin / Products</p>
            <h1>Product Management</h1>
            <p className="admin-products-subtitle">
              Manage your boutique collection, pricing and inventory.
            </p>
          </div>

          <div className="admin-products-header-actions">
            <button
              className="admin-products-refresh"
              onClick={loadProducts}
              disabled={loading}
            >
              ↻ Refresh
            </button>

            <button
              className="admin-products-add-btn"
              onClick={openAddModal}
            >
              + Add Product
            </button>
          </div>
        </header>

        <section className="admin-products-stats">
          <article>
            <span>Total Products</span>
            <strong>{products.length}</strong>
          </article>

          <article>
            <span>In Stock</span>
            <strong>
              {
                products.filter(
                  (product) =>
                    Number(product.stock) > 5 &&
                    product.status !== "out_of_stock"
                ).length
              }
            </strong>
          </article>

          <article>
            <span>Low Stock</span>
            <strong>
              {
                products.filter(
                  (product) =>
                    Number(product.stock) > 0 &&
                    Number(product.stock) <= 5
                ).length
              }
            </strong>
          </article>

          <article>
            <span>Out of Stock</span>
            <strong>
              {
                products.filter(
                  (product) =>
                    Number(product.stock) === 0 ||
                    product.status === "out_of_stock"
                ).length
              }
            </strong>
          </article>
        </section>

        <section className="admin-products-panel">
          <div className="admin-products-panel-heading">
            <div>
              <h2>All Products</h2>
              <p>{filteredProducts.length} products found</p>
            </div>
          </div>

          <div className="admin-products-toolbar">
            <input
              type="search"
              placeholder="Search by product name, category or SKU..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="ALL">All Categories</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
            >
              <option value="ALL">All Stock</option>
              <option value="IN">In Stock</option>
              <option value="LOW">Low Stock</option>
              <option value="OUT">Out of Stock</option>
            </select>
          </div>

          {error && (
            <div className="admin-products-error">
              {error}
              <button onClick={loadProducts}>Retry</button>
            </div>
          )}

          {loading ? (
            <div className="admin-products-loading">
              <div className="admin-products-spinner" />
              <p>Loading products...</p>
            </div>
          ) : (
            <div className="admin-products-table-wrap">
              <table className="admin-products-table">
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>SKU</th>
                    <th>CATEGORY</th>
                    <th>PRICE</th>
                    <th>STOCK</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.length ? (
                    filteredProducts.map((product) => {
                      const image = getProductImage(product);
                      const stockStatus = getStockStatus(product);

                      return (
                        <tr key={product._id}>
                          <td>
                            <div className="admin-products-product-cell">
                              {image ? (
                                <img
                                  src={image}
                                  alt={product.name}
                                  className="admin-products-image"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="admin-products-image-placeholder">
                                  R
                                </div>
                              )}

                              <div>
                                <strong>{product.name}</strong>
                                <span>
                                  {product.sizes?.length
                                    ? `Sizes: ${product.sizes.join(", ")}`
                                    : "Rajlaxmi Collection"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>{product.sku || "—"}</td>

                          <td>{product.category || "—"}</td>

                          <td>
                            <div className="admin-products-price">
                              <strong>
                                {formatCurrency(
                                  product.salePrice ?? product.price
                                )}
                              </strong>

                              {product.salePrice !== undefined &&
                                product.salePrice !== null &&
                                Number(product.salePrice) <
                                  Number(product.price) && (
                                  <span>
                                    {formatCurrency(product.price)}
                                  </span>
                                )}
                            </div>
                          </td>

                          <td>
                            <strong>{Number(product.stock) || 0}</strong>
                          </td>

                          <td>
                            <span
                              className={`admin-products-stock ${stockStatus.className}`}
                            >
                              {stockStatus.label}
                            </span>
                          </td>

                          <td>
                            <div className="admin-products-actions">
                              <button
                                className="admin-products-edit-btn"
                                onClick={() => openEditModal(product)}
                              >
                                Edit
                              </button>

                              <button
                                className="admin-products-delete-btn"
                                onClick={() => handleDelete(product)}
                                disabled={deletingId === product._id}
                              >
                                {deletingId === product._id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="admin-products-empty">
                        {products.length
                          ? "No products match your filters."
                          : "No products found. Add your first product."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="admin-products-footer">
          © {new Date().getFullYear()} Rajlaxmi Boutique · Admin Panel
        </footer>
      </main>

      {modalOpen && (
        <div
          className="admin-products-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="admin-products-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editingProduct ? "Edit product" : "Add product"}
          >
            <div className="admin-products-modal-header">
              <div>
                <p>RAJLAXMI BOUTIQUE</p>
                <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
                <span>Enter product details below.</span>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-products-form-grid">
                <label>
                  Product Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Designer Kurti"
                    required
                  />
                </label>

                <label>
                  Category *
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="e.g. Kurtis"
                    required
                  />
                </label>

                <label>
                  SKU *
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="e.g. KUR-001"
                    required
                  />
                </label>

                <label>
                  Regular Price (₹) *
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Sale Price (₹)
                  <input
                    name="salePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.salePrice}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </label>

                <label>
                  Stock Quantity *
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="admin-products-form-full">
                  Description
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the product..."
                    rows="3"
                  />
                </label>

                <label>
                  Sizes
                  <input
                    name="sizes"
                    value={form.sizes}
                    onChange={handleChange}
                    placeholder="S, M, L, XL"
                  />
                  <small>Comma se separate karo.</small>
                </label>

                <label>
                  Colors
                  <input
                    name="colors"
                    value={form.colors}
                    onChange={handleChange}
                    placeholder="Red, Pink, Blue"
                  />
                  <small>Comma se separate karo.</small>
                </label>

                <div className="admin-products-form-full admin-product-images-field">
                  <label htmlFor="product-image-upload">Product Images (maximum 5)</label>
                  <input
                    id="product-image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleImageSelect}
                    disabled={saving || uploadingImages}
                  />
                  <small>JPG, PNG, WEBP ya GIF. Har image maximum 5 MB.</small>
                  <div className="admin-products-form-full">
                    <label htmlFor="product-video-upload">
                      Product Reel / Video
                    </label>

                    <input
                      id="product-video-upload"
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={handleVideoSelect}
                      disabled={saving || uploadingVideo}
                    />

                    <small>MP4, WEBM ya MOV — maximum 50 MB.</small>

                    {videoPreview && (
                      <video
                        src={videoPreview}
                        controls
                        playsInline
                        style={{
                          width: "180px",
                          maxHeight: "280px",
                          display: "block",
                          marginTop: "12px",
                          borderRadius: "10px",
                        }}
                      />
                    )}

                    {!videoPreview && form.videoUrl && (
                      <video
                        src={form.videoUrl}
                        controls
                        playsInline
                        style={{
                          width: "180px",
                          maxHeight: "280px",
                          display: "block",
                          marginTop: "12px",
                          borderRadius: "10px",
                        }}
                      />
                    )}
                  </div>
                  <div className="admin-image-preview-grid">
                    {form.images
                      .split("\n")
                      .map((url) => url.trim())
                      .filter(Boolean)
                      .map((url, index) => (
                        <div className="admin-image-preview-item" key={`${url}-${index}`}>
                          <img src={url} alt={`Product image ${index + 1}`} />
                          <button type="button" onClick={() => removeExistingImage(index)} disabled={saving || uploadingImages|| uploadingVideo}>
                            Remove
                          </button>
                        </div>
                      ))}

                    {imagePreviews.map((preview, index) => (
                      <div className="admin-image-preview-item" key={`${preview.name}-${index}`}>
                        <img src={preview.url} alt={preview.name} />
                        <button type="button" onClick={() => removeSelectedImage(index)} disabled={saving || uploadingImages|| uploadingVideo}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="admin-products-form-actions">
                <button
                  type="button"
                  className="admin-products-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-products-save-btn"
                  disabled={saving || uploadingImages}
                >
                  {uploadingImages
                    ? "Uploading images..."
                    : uploadingVideo
                    ? "Uploading video..."
                    : saving
                      ? "Saving..."
                    : editingProduct
                      ? "Save Changes"
                      : "Add Product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;