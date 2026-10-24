// FILE: App.jsx - the route table. Satisfies AUTH-07 (protected routes) and DEPLOY-06 (client-side routes).
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute, { homePathFor } from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CustomerDashboard from "./pages/CustomerDashboard.jsx";
import AgentDashboard from "./pages/AgentDashboard.jsx";
import CreateTicket from "./pages/CreateTicket.jsx";
import TicketDetail from "./pages/TicketDetail.jsx";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <p className="page-message" role="status">Loading...</p>;
  return <Navigate to={user ? homePathFor(user) : "/login"} replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/customer" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/customer/new" element={<ProtectedRoute role="customer"><CreateTicket /></ProtectedRoute>} />
          <Route path="/agent" element={<ProtectedRoute role="agent"><AgentDashboard /></ProtectedRoute>} />
          {/* Both roles can open a ticket; the BACKEND decides which tickets each role may see. */}
          <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </main>
    </>
  );
}
