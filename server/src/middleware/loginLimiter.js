// FILE: middleware/loginLimiter.js
// Responsibility: basic login rate limiting -> HTTP 429. (AUTH-10)
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // max FAILED attempts per IP per 15 minutes
  skipSuccessfulRequests: true, // only FAILED logins count toward the limit
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ message: "Too many login attempts. Try again in 15 minutes." }),
});
