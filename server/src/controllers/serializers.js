// FILE: controllers/serializers.js
// Responsibility: decide exactly which fields are sent to the browser (never password hashes). (AUTH-13)

export function ticketToJson(ticket) {
  // customerId is populated (name/email) when we load tickets, so we expose it as "customer".
  const customer = ticket.customerId && ticket.customerId._id ? ticket.customerId : null;
  return {
    _id: ticket._id.toString(),
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    customer: customer ? { id: customer._id.toString(), name: customer.name, email: customer.email } : null,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

// "sender" is { id, name, role }.
export function messageToJson(message, sender) {
  return {
    _id: message._id.toString(), // stable ID used by the frontend to avoid duplicates
    ticketId: message.ticketId.toString(),
    body: message.body,
    createdAt: message.createdAt,
    sender: { id: sender.id, name: sender.name, role: sender.role },
  };
}
