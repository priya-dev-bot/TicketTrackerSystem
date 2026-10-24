
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../services/api.js";
import { homePathFor } from "../components/ProtectedRoute.jsx";
import Notice from "../components/Notice.jsx";

export default function RegisterPage() {
  const { user, register, loading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("customer");
  const [agentCode, setAgentCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Please enter your name (at least 2 characters).");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (role === "agent" && !agentCode.trim()) {
      setError("Please enter the agent registration code.");
      return;
    }

    setSubmitting(true);

    try {
      const created = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        agentCode: role === "agent" ? agentCode.trim() : undefined,
      });

      navigate(homePathFor(created), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="login-page register-page">
      <div className="login-welcome">
        <div className="login-brand-mark" aria-hidden="true">
          <span>✓</span>
        </div>

        <span className="login-eyebrow">SUPPORT CENTER</span>

        <h1>Better support starts here.</h1>

        <p>
          Create your account to manage support requests,
          follow updates, and keep every conversation organized.
        </p>

        <div className="login-benefits">
          <div className="login-benefit">
            <span aria-hidden="true">✓</span>
            Customers can create and track tickets.
          </div>

          <div className="login-benefit">
            <span aria-hidden="true">✓</span>
            Support agents can manage customer requests.
          </div>
        </div>
      </div>

      <div className="login-form-panel register-form-panel">
        <div className="login-form-heading">
          <span className="login-form-label">GET STARTED</span>
          <h2>Create account</h2>
          <p>Enter your details to get started.</p>
        </div>

        <Notice type="error">{error}</Notice>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="login-form"
        >
          <div className="login-field">
            <label htmlFor="role">Account type</label>
            <select
              id="role"
              className="login-input register-select"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="customer">Customer</option>
              <option value="agent">Support Agent</option>
            </select>
            <small className="register-help">
              Choose the role that matches your account.
            </small>
          </div>

          <div className="login-field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              className="login-input"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              className="login-input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="login-input"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              className="login-input"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
            />
          </div>

          {role === "agent" && (
            <div className="login-field register-agent-field">
              <label htmlFor="agentCode">Agent registration code</label>
              <input
                id="agentCode"
                className="login-input"
                type="password"
                autoComplete="off"
                placeholder="Enter your invite code"
                value={agentCode}
                onChange={(event) => setAgentCode(event.target.value)}
                required
              />
              <small className="register-help">
                An authorised registration code is required for agents.
              </small>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary login-submit register-submit"
            disabled={submitting || loading}
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="login-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>

        <p className="register-privacy">
          Your account access depends on your assigned role.
        </p>
      </div>
    </section>
  );
}
