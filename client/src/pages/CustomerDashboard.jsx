
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../services/api.js";
import StatusFilter from "../components/StatusFilter.jsx";
import TicketList from "../components/TicketList.jsx";
import Notice from "../components/Notice.jsx";

export default function CustomerDashboard() {
  const [filter, setFilter] = useState("All");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/tickets", {
          params: { status: filter },
        });

        if (!cancelled) setTickets(res.data.tickets);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <section className="customer-dashboard">
      <header className="customer-hero">
        <div className="customer-hero-content">
          <span className="customer-eyebrow">
            INSTAPORT CUSTOMER SUPPORT
          </span>

          <h1>Your support, all in one place.</h1>

          <p>
            Track your requests, follow updates, and stay connected
            with our support team.
          </p>

          <Link to="/customer/new" className="customer-hero-button">
            <span aria-hidden="true">+</span> Create a ticket
          </Link>
        </div>

        <div className="customer-hero-art" aria-hidden="true">
          <div className="customer-art-card customer-art-card-back">
            <span className="customer-art-line" />
            <span className="customer-art-line short" />
          </div>

          <div className="customer-art-card customer-art-card-front">
            <span className="customer-art-check">✓</span>
            <div>
              <strong>Support request</strong>
              <small>We're here to help</small>
            </div>
          </div>
        </div>
      </header>

      <div className="customer-section-heading">
        <div>
          <h2>My tickets</h2>
          <p>All your support requests and their latest status.</p>
        </div>

        <span className="customer-ticket-count">
          {!loading && !error
            ? `${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"}`
            : loading
              ? "Loading…"
              : "Tickets"}
        </span>
      </div>

      <div className="customer-filter-panel">
        <div className="customer-filter-heading">
          <span className="customer-filter-dot" />
          Filter your requests
        </div>

        <StatusFilter value={filter} onChange={setFilter} />
      </div>

      <Notice type="error">{error}</Notice>

      {loading && (
        <div className="customer-state" role="status">
          <span className="customer-spinner" />
          <p>Loading your tickets...</p>
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div className="customer-empty">
          <div className="customer-empty-icon" aria-hidden="true">
            ♧
          </div>

          <h3>
            {filter === "All"
              ? "Your support journey starts here"
              : `No ${filter.toLowerCase()} tickets`}
          </h3>

          <p>
            {filter === "All"
              ? "Have a question or an issue? Create a ticket and our support team will help you."
              : "There are no tickets with this status. Try another filter."}
          </p>

          {filter === "All" && (
            <Link to="/customer/new" className="btn btn-primary">
              Create your first ticket →
            </Link>
          )}
        </div>
      )}

      {!loading && !error && tickets.length > 0 && (
        <div className="customer-ticket-list">
          <TicketList tickets={tickets} showCustomer={false} />
        </div>
      )}
    </section>
  );
}
