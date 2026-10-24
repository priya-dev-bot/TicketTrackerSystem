// FILE: middleware/requireRole.js
// Responsibility: AUTHORIZATION by role. Used on agent-only routes (status/priority). (CUST-06, AUTH-06)
export function requireRole(role) {
  return (req, res, next) => {
    // req.user was set by requireAuth from the verified JWT + database, so the client cannot fake it.
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "You do not have permission to do this" });
    }
    next();
  };
}
