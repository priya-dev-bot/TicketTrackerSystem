// FILE: pages/AgentDashboard.jsx - ALL tickets from all customers, with filters. (AGENT-01)
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
        const res = await api.get("/tickets", { params: { status: filter } });
        if (!cancelled) setTickets(res.data.tickets);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [filter]);

  return (
    <section>
      <div className="page-head">
        <h1>All customer tickets</h1>
        <span className="muted">{!loading && !error ? `${tickets.length} shown` : ""}</span>
      </div>
      <StatusFilter value={filter} onChange={setFilter} />
      <Notice type="error">{error}</Notice>
      {loading && <p className="page-message" role="status">Loading tickets...</p>}
      {!loading && !error && tickets.length === 0 && (
        <div className="empty"><p>{filter === "All" ? "No tickets have been created yet." : `No ${filter} tickets right now.`}</p></div>
      )}
      {!loading && tickets.length > 0 && <TicketList tickets={tickets} showCustomer={true} />}
    </section>
  );
}
