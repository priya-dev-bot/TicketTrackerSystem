// FILE: config/env.js
// Responsibility: load environment variables ONE time and expose them as a small object.
// Why: secrets (JWT_SECRET, MONGODB_URI) must come from the environment, never from code. (AUTH-09, DEPLOY-07)
// Used by: db.js, auth middleware, socket auth, cors config, server.js.
import "dotenv/config";

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
    // Secret invite code needed to register as a Support Agent. If unset, agent sign-up is disabled.
  agentRegistrationCode: process.env.AGENT_REGISTRATION_CODE,
  // Allowed frontend origins (HTTP + Socket.IO). Split on commas so we can allow more than one.
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};

// Fail fast: a server without a JWT secret would be insecure, so refuse to start.
export function assertRequiredEnv() {
  if (!env.jwtSecret) throw new Error("JWT_SECRET is missing. Set it in your environment.");
  if (!env.mongoUri) throw new Error("MONGODB_URI is missing. Set it in your environment.");
}
