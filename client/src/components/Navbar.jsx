// FILE: components/Navbar.jsx - brand, role-specific links and the logout button.
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout("You have been logged out.");
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to={user ? (user.role === "agent" ? "/agent" : "/customer") : "/login"} className="brand">
          <span className="brand-mark" aria-hidden="true">I</span>
          Instaport Delivery <span className="brand-sub">Support</span>
        </Link>
        {user && (
          <nav className="nav-links" aria-label="Main">
            {user.role === "customer" && (
              <>
                <NavLink to="/customer" end>My tickets</NavLink>
                <NavLink to="/customer/new">New ticket</NavLink>
              </>
            )}
            {user.role === "agent" && <NavLink to="/agent">All tickets</NavLink>}
            <span className="nav-user">
              {user.name} <span className="role-chip">{user.role === "agent" ? "Support Agent" : "Customer"}</span>
            </span>
            <button type="button" className="btn btn-light" onClick={handleLogout}>Log out</button>
          </nav>
        )}
      </div>
    </header>
  );
}
