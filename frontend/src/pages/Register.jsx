import "./Register.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaArrowRight,
} from "react-icons/fa";
import api from "../api/axios";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-3d-page">
      <div className="register-3d-layout">

        {/* LEFT: 3D Boutique Experience */}
        <section className="register-3d-scene">
          <div className="scene-glow"></div>

          <div className="scene-particles">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} />
            ))}
          </div>

          <div className="scene-content">
            <div className="scene-badge">✦ ROYAL COLLECTION ✦</div>

            <div className="fabric-stage">
              <div className="fabric-back"></div>
              <div className="fabric-fold fabric-fold-one"></div>
              <div className="fabric-fold fabric-fold-two"></div>
              <div className="fabric-fold fabric-fold-three"></div>
              <div className="fabric-gold-pattern">✺</div>
            </div>

            <div className="scene-caption">
              <span>THE ART OF INDIAN ELEGANCE</span>
              <h1>Tradition Meets Beauty</h1>
              <p>Discover the timeless charm of Rajlaxmi Boutique.</p>
            </div>
          </div>
        </section>

        {/* RIGHT: Registration Form */}
        <section className="register-3d-form-section">
          <div className="register-3d-card">

            <Link to="/" className="auth-brand">
              <span className="auth-brand-icon">❀</span>
              <span>
                <strong>RAJLAXMI</strong>
                <small>B O U T I Q U E</small>
              </span>
            </Link>

            <p className="auth-eyebrow">JOIN OUR COMMUNITY</p>
            <h1>Create Account</h1>
            <p className="auth-description">
              Create your account and explore timeless Indian fashion.
            </p>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <label htmlFor="name">Full Name</label>
              <div className="auth-input-wrap">
                <FaUser />
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              <label htmlFor="email">Email Address</label>
              <div className="auth-input-wrap">
                <FaEnvelope />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
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
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>

              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="auth-input-wrap">
                <FaLock />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
                {!loading && <FaArrowRight />}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>

            <Link to="/" className="auth-back">
              ← Back to Boutique
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
