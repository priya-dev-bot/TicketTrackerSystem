// FILE: components/Notice.jsx - success / error message. Errors use role="alert" so screen readers announce them.
export default function Notice({ type, children }) {
  if (!children) return null;
  return (
    <p className={`notice notice-${type}`} role={type === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}
