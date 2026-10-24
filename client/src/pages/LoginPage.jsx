// FILE: pages/LoginPage.jsx - login form. Shows server errors and "session expired" messages. (AUTH-01, AUTH-08)
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

  if (!loading && user) return <Navigate to={homePathFor(user)} replace />;

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
      // Go back to the page they wanted if their role allows it, otherwise to their dashboard.
      const wanted = location.state && location.state.from;
      const roleHome = homePathFor(loggedIn);
      const allowed = wanted && (wanted.startsWith("/tickets/") || wanted.startsWith(roleHome));
      navigate(allowed ? wanted : roleHome, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <section className="card login-card">
      <h1>Log in to Instaport Support</h1>
      <p className="muted">Customers track their delivery tickets. Support agents manage them.</p>
      <Notice type="info">{sessionMessage}</Notice>
      <Notice type="error">{error}</Notice>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
    </section>
  );
}
