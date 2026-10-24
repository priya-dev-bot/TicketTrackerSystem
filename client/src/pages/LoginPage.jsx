
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../services/api.js";
import { homePathFor } from "../components/ProtectedRoute.jsx";
import Notice from "../components/Notice.jsx";

export default function LoginPage() {
  const { user, login, sessionMessage, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);

    try {
      const loggedIn = await login(email.trim(), password);
      const wanted = location.state && location.state.from;
      const roleHome = homePathFor(loggedIn);
      const allowed =
        wanted &&
        (wanted.startsWith("/tickets/") || wanted.startsWith(roleHome));

      navigate(allowed ? wanted : roleHome, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <section className="login-page">
      <div className="login-welcome">
        <div className="login-brand-mark" aria-hidden="true">
          <span>i</span>
        </div>

        <span className="login-eyebrow">INSTAPORT SUPPORT CENTER</span>

        <h1>Welcome back.</h1>

        <p>
          Sign in to manage your support requests, follow ticket updates,
          and stay connected with our team.
        </p>

        <div className="login-benefits">
          <div className="login-benefit">
            <span aria-hidden="true">✓</span>
            Track your support tickets
          </div>

          <div className="login-benefit">
            <span aria-hidden="true">✓</span>
            Keep conversations in one place
          </div>

          <div className="login-benefit">
            <span aria-hidden="true">✓</span>
            Get updates on your requests
          </div>
        </div>

        <div className="login-decoration" aria-hidden="true">
          <div className="login-decoration-card">
            <span className="login-decoration-check">✓</span>
            <div>
              <strong>Support made simple</strong>
              <small>Every request, one place.</small>
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-heading">
          <span className="login-form-label">YOUR ACCOUNT</span>
          <h2>Log in</h2>
          <p>Enter your details to access your account.</p>
        </div>

        <Notice type="info">{sessionMessage}</Notice>
        <Notice type="error">{error}</Notice>

        <form onSubmit={handleSubmit} noValidate className="login-form">
          <div className="login-field">
            <label htmlFor="email">Email address</label>
            <input
              className="login-input"
              id="email"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              className="login-input"
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={submitting || loading}
          >
            {submitting ? "Logging in..." : "Log in to your account"}
            {!submitting && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <p className="login-security-note">
          <span aria-hidden="true">●</span>
          Your account is protected by secure authentication.
        </p>
      </div>
    </section>
  );
}
