// FILE: components/TicketList.jsx - list of tickets (cards that stack on mobile). Used by both dashboards.
import { Link } from "react-router-dom";
import { StatusBadge, PriorityBadge } from "./Badge.jsx";

export default function TicketList({ tickets, showCustomer }) {
  return (
    <ul className="ticket-list">
      {tickets.map((t) => (
        <li key={t._id}>
          <Link to={`/tickets/${t._id}`} className="ticket-card">
            <div className="ticket-main">
              <span className="ticket-subject">{t.subject}</span>
              {showCustomer && t.customer && (
                <span className="ticket-customer">Customer: {t.customer.name} ({t.customer.email})</span>
              )}
            </div>
            <div className="ticket-meta">
              <StatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
              <span className="ticket-date">Updated {new Date(t.updatedAt).toLocaleString()}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
