// FILE: components/Badge.jsx - status and priority badges. Always show a TEXT label, not just a colour. (UI-02)
export function StatusBadge({ status }) {
  const cls = status === "Open" ? "open" : status === "In Progress" ? "progress" : "resolved";
  return <span className={`badge badge-${cls}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge priority-${priority.toLowerCase()}`}>{priority} priority</span>;
}
