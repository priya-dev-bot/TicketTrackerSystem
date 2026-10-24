// FILE: hooks/useTicketSocket.js
// Responsibility: join ONE ticket's room, listen for live events, and clean up. Satisfies RT-01, SOCK-02, SOCK-08.
import { useEffect, useRef } from "react";
import { getSocket } from "../services/socket.js";

// handlers = { onMessage(message), onTicketUpdated(ticket), onJoined() }
export function useTicketSocket(ticketId, handlers) {
  // Keep the latest handlers in a ref so the effect below does not need to re-run on every render.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Ask the server for permission to join this ticket's room. The server re-checks ownership.
    function joinRoom() {
      socket.emit("ticket:join", ticketId, (ack) => {
        if (ack && ack.ok && handlersRef.current.onJoined) handlersRef.current.onJoined();
      });
    }
    const onMessage = (m) => handlersRef.current.onMessage && handlersRef.current.onMessage(m);
    const onUpdated = (t) => handlersRef.current.onTicketUpdated && handlersRef.current.onTicketUpdated(t);

    socket.on("message:new", onMessage);
    socket.on("ticket:updated", onUpdated);
    socket.on("connect", joinRoom); // runs again after a reconnect, so the room is rejoined
    if (socket.connected) joinRoom();

    // CLEANUP when leaving the ticket page (or on logout): remove listeners and leave the room.
    return () => {
      socket.off("message:new", onMessage);
      socket.off("ticket:updated", onUpdated);
      socket.off("connect", joinRoom);
      if (socket.connected) socket.emit("ticket:leave", ticketId);
    };
  }, [ticketId]);
}
