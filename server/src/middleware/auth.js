// FILE: middleware/auth.js
// Responsibility: AUTHENTICATION - prove who the caller is from the JWT. (AUTH-08)
// Authentication = "who are you?"   Authorization = "what are you allowed to do?" (see requireRole.js / ticketAccess.js)
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

// Shared by the HTTP middleware AND the socket handshake so both use identical rules.
// Throws an error with code "EXPIRED" or "INVALID".
export async function verifyToken(token) {
  let payload;
  try {
    // Checks the signature AND the expiry time (exp claim).
    payload = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    const expired = err.name === "TokenExpiredError";
    const e = new Error(expired ? "Session expired. Please log in again." : "Invalid token");
    e.code = expired ? "EXPIRED" : "INVALID";
    throw e;
  }
  // Re-load the user so a deleted user's old token stops working. passwordHash is not selected.
  const user = await User.findById(payload.id).select("name email role");
  if (!user) {
    const e = new Error("Invalid token");
    e.code = "INVALID";
    throw e;
  }
  return {
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    exp: payload.exp, // expiry time in seconds; the socket layer uses it to disconnect at expiry
  };
}

export async function requireAuth(req, res, next) {
  try {
    // Expected header:  Authorization: Bearer <token>
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Please log in to continue" });
    }
    const { user } = await verifyToken(token);
    req.user = user; // From here on, controllers trust req.user, NOT anything in the request body.
    next();
  } catch (err) {
    if (err.code) return res.status(401).json({ message: err.message });
    next(err);
  }
}
