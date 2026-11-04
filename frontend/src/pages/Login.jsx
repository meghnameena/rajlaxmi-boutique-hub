import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaArrowRight } from "react-icons/fa";
import api from "../api/axios";
import "./Login.css";
export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", form);
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout">

        {/* Left Welcome Video */}
        <section className="auth-video-section">
          <video className="auth-welcome-video" src="/login-welcome.mp4"autoPlay controls loop playsInline/>

          <div className="auth-video-overlay">
            <h2>Welcome to Rajlaxmi Boutique</h2>
            <p>Elegance in Every Thread</p>
          </div>
        </section>

        {/* Right Login Card */}
        <section className="auth-card login-royal-card">

          <Link to="/" className="auth-brand">
            <span className="auth-brand-icon">❀</span>
            <span>
              <strong>RAJLAXMI</strong>
              <small>B O U T I Q U E</small>
            </span>
          </Link>

          <p className="auth-eyebrow">WELCOME BACK</p>
          <h1>Sign In</h1>

          <p className="auth-description">
            Sign in to discover your favourite ethnic styles.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email Address</label>

            <div className="auth-input-wrap">
              <FaEnvelope />
              <input id="email" name="email" type="email" placeholder="Enter your email" value={form.email}  onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <label htmlFor="password">Password</label>

            <div className="auth-input-wrap">
              <FaLock />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <FaArrowRight />}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/register">Create Account</Link>
          </p>

          <Link to="/" className="auth-back">
            ← Back to Boutique
          </Link>

        </section>
      </div>
    </main>
  );
}
