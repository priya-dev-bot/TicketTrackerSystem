// FILE: sockets/index.js
// Responsibility: SECURE Socket.IO setup. Requirements: SOCK-01, SOCK-02, SOCK-03, SOCK-06, SOCK-07, RT-01.
// Design: sockets only RECEIVE data (join/leave rooms + listen). Replies are WRITTEN through the protected
// HTTP endpoint, so there is exactly one validated write path (SOCK-04).
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { verifyToken } from "../middleware/auth.js";
import { findAccessibleTicket } from "../services/ticketAccess.js";
import { setIo, ticketRoom } from "./io.js";

export function attachSocketServer(httpServer) {
  const io = new Server(httpServer, {
    // Same restricted origin list as the HTTP API (not "*"). (SOCK-07)
    cors: { origin: env.clientOrigins, methods: ["GET", "POST"] },
  });
  setIo(io);

  // 1) HANDSHAKE AUTHENTICATION - runs once for every new connection, before anything else.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication required"));
      const { user, exp } = await verifyToken(token); // rejects invalid or expired tokens
      socket.data.user = user; // trusted identity, derived on the server
      socket.data.tokenExp = exp;
      next();
    } catch (err) {
      next(new Error(err.code ? err.message : "Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    // 2) TOKEN EXPIRY: a socket stays connected for a long time, so we disconnect it when its token expires.
    // Limit: we cannot revoke a still-valid token instantly on the server (stateless JWT). Logout disconnects the
    // client's socket right away, and expiry (default 1h) bounds how long a stolen token could keep a socket open.
    const msUntilExpiry = socket.data.tokenExp * 1000 - Date.now();
    const expiryTimer = setTimeout(() => {
      socket.emit("auth:expired");
      socket.disconnect(true);
    }, Math.min(Math.max(msUntilExpiry, 0), 2 ** 31 - 1));

    // 3) AUTHORIZED ROOM JOIN: ownership is checked on EVERY join. Knowing a ticket ID is not enough.
    socket.on("ticket:join", async (ticketId, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        const ticket = await findAccessibleTicket(ticketId, socket.data.user); // same rule as HTTP
        if (!ticket) return reply({ ok: false, message: "Ticket not found or access denied" });
        socket.join(ticketRoom(ticket._id.toString()));
        reply({ ok: true });
      } catch (err) {
        console.error("Socket join error:", err);
        reply({ ok: false, message: "Could not join ticket" });
      }
    });

    socket.on("ticket:leave", (ticketId) => {
      if (typeof ticketId === "string") socket.leave(ticketRoom(ticketId));
    });

    socket.on("disconnect", () => clearTimeout(expiryTimer));
  });

  return io;
}
