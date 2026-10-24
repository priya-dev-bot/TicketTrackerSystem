// FILE: services/socket.js
// Responsibility: create/destroy the single Socket.IO connection. Satisfies SOCK-06, SOCK-08, DEPLOY-03.
// The socket address comes from VITE_SOCKET_URL. The JWT is sent in the handshake (auth.token).
import { io } from "socket.io-client";

let socket = null;

export function connectSocket(token, onAuthProblem) {
  disconnectSocket(); // never keep two connections
    const url = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? "http://localhost:5000" : "");
  // No socket server configured (Vercel-only hosting): skip sockets, pages poll instead.
  if (!url) return null;
  socket = io(url, { auth: { token } });

  // Server rejected the handshake (missing/invalid/expired token) -> treat as logged out.
  socket.on("connect_error", (err) => {
    if (/token|expired|authentication/i.test(err.message)) {
      onAuthProblem("Your session expired. Please log in again.");
    }
  });
  // Server closes the socket when the token expires.
  socket.on("auth:expired", () => onAuthProblem("Your session expired. Please log in again."));
  return socket;
}

export function getSocket() {
  return socket;
}

// Called on logout: remove all listeners and close the connection.
export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
