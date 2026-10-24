// FILE: components/ProtectedRoute.jsx
// Responsibility: frontend route protection (AUTH-07). This is for user experience only -
// the BACKEND still enforces every real permission.
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function homePathFor(user) {
  return user.role === "agent" ? "/agent" : "/customer";
}

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="page-message" role="status">Checking your session...</p>;
  // Not logged in -> login page (remember where they wanted to go).
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  // Logged in with the wrong role -> send them to their own dashboard.
  if (role && user.role !== role) return <Navigate to={homePathFor(user)} replace />;
  return children;
}
