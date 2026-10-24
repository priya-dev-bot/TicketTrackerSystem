// FILE: sockets/io.js
// Responsibility: hold the Socket.IO server so controllers can emit events without importing server.js.
// If no socket server is attached (e.g. some tests), emitting is silently skipped.
let ioInstance = null;

export function setIo(io) {
  ioInstance = io;
}

// Room names are built in ONE place so the join code and the emit code always match.
export function ticketRoom(ticketId) {
  return `ticket:${ticketId}`;
}

// Send an event ONLY to sockets that were authorized to join this ticket's room. (SOCK-05)
export function emitToTicket(ticketId, eventName, payload) {
  if (!ioInstance) return;
  ioInstance.to(ticketRoom(ticketId.toString())).emit(eventName, payload);
}
