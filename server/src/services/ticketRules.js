// FILE: services/ticketRules.js
// Responsibility: the business rules for status and priority in ONE place. (AGENT-02, AGENT-03)
// Both the controller and the tests use this file, so the rule is never duplicated.

export const STATUSES = ["Open", "In Progress", "Resolved"];
export const PRIORITIES = ["Low", "Medium", "High"];

// The only allowed forward move for each status. Resolved has no next step (no reopening).
const NEXT_STATUS = {
  Open: "In Progress",
  "In Progress": "Resolved",
  Resolved: null,
};

// Returns { ok: true } or { ok: false, message }.
export function checkStatusChange(currentStatus, requestedStatus) {
  if (!STATUSES.includes(requestedStatus)) {
    return { ok: false, message: `Status must be one of: ${STATUSES.join(", ")}` };
  }
  if (currentStatus === "Resolved") {
    return { ok: false, message: "Resolved tickets cannot be reopened" };
  }
  if (NEXT_STATUS[currentStatus] !== requestedStatus) {
    return {
      ok: false,
      message: `Status can only move from ${currentStatus} to ${NEXT_STATUS[currentStatus]}`,
    };
  }
  return { ok: true };
}
