
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api.js";
import StatusFilter from "../components/StatusFilter.jsx";
import TicketList from "../components/TicketList.jsx";
import Notice from "../components/Notice.jsx";

export default function AgentDashboard() {
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
    <section className="agent-dashboard">
      <header className="agent-hero">
        <div className="agent-hero-content">
          <span className="agent-eyebrow">
            INSTAPORT SUPPORT CENTER
          </span>

          <h1>Agent Dashboard</h1>

          <p>
            Manage customer requests, track progress, and keep every
            conversation moving.
          </p>
        </div>

        <div className="agent-hero-icon" aria-hidden="true">
          <span>✓</span>
        </div>
      </header>

      <div className="agent-section-heading">
        <div>
          <h2>Customer tickets</h2>
          <p>View and manage requests from all customers.</p>
        </div>

        <span className="agent-count">
          {!loading && !error ? `${tickets.length} tickets` : "Loading…"}
        </span>
      </div>

      <div className="agent-filter-panel">
        <div className="agent-filter-label">
          <span className="agent-filter-dot" />
          Filter by status
        </div>

        <StatusFilter value={filter} onChange={setFilter} />
      </div>

      <Notice type="error">{error}</Notice>

      {loading && (
        <div className="agent-state" role="status">
          <span className="agent-spinner" />
          <p>Loading customer tickets…</p>
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div className="agent-empty">
          <div className="agent-empty-icon" aria-hidden="true">
            ♧
          </div>

          <h3>
            {filter === "All"
              ? "Your inbox is clear"
              : `No ${filter.toLowerCase()} tickets`}
          </h3>

          <p>
            {filter === "All"
              ? "New customer requests will appear here when they arrive."
              : "Try selecting another status to see more tickets."}
          </p>
        </div>
      )}

      {!loading && !error && tickets.length > 0 && (
        <div className="agent-ticket-list">
          <TicketList tickets={tickets} showCustomer={true} />
        </div>
      )}
    </section>
  );
}
