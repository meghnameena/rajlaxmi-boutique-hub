
import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaArrowRight } from "react-icons/fa";
import api from "../api/axios";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email,
      });

      setMessage(response.data.message);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to send reset link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forgot-page">
      <div className="forgot-card">
        <Link to="/" className="forgot-brand">
          ❀ RAJLAXMI BOUTIQUE
        </Link>

        <h1>Forgot Password?</h1>

        <p>
          Enter your registered email address.
          We will send you a password reset link.
        </p>

        {message && (
          <div className="forgot-success">{message}</div>
        )}

        {error && (
          <div className="forgot-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Email Address</label>

          <div className="forgot-input">
            <FaEnvelope />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
            {!loading && <FaArrowRight />}
          </button>
        </form>

        <Link to="/login" className="forgot-back">
          ← Back to Login
        </Link>
      </div>
    </main>
  );
}
