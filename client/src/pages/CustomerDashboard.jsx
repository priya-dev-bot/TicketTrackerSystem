// FILE: pages/CustomerDashboard.jsx - the customer's own tickets with filters. (CUST-02, CUST-03, UI-04)
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
    let cancelled = false; // ignore late responses from an older filter click
    async function load() {
      setLoading(true);
      setError("");
      try {
        // The server only returns THIS customer's tickets (identity comes from the token).
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
        <h1>My tickets</h1>
        <Link to="/customer/new" className="btn btn-primary">Create ticket</Link>
      </div>
      <StatusFilter value={filter} onChange={setFilter} />
      <Notice type="error">{error}</Notice>
      {loading && <p className="page-message" role="status">Loading your tickets...</p>}
      {!loading && !error && tickets.length === 0 && (
        <div className="empty">
          <p>{filter === "All" ? "You have no tickets yet." : `You have no ${filter} tickets.`}</p>
          {filter === "All" && <Link to="/customer/new" className="btn btn-primary">Create your first ticket</Link>}
        </div>
      )}
      {!loading && tickets.length > 0 && <TicketList tickets={tickets} showCustomer={false} />}
    </section>
  );
}
