// FILE: components/StatusFilter.jsx - All / Open / In Progress / Resolved filter buttons. (CUST-03, AGENT-01)
const OPTIONS = ["All", "Open", "In Progress", "Resolved"];

export default function StatusFilter({ value, onChange }) {
  return (
    <div className="filters" role="group" aria-label="Filter tickets by status">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          className={`filter-btn ${value === option ? "active" : ""}`}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
