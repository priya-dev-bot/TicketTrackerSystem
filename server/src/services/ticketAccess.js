// FILE: services/ticketAccess.js
// Responsibility: the SINGLE ownership/authorization check, used by HTTP controllers AND socket room joins.
// This is what makes "knowing a ticket ID never grants access" true everywhere. (AUTH-05, SOCK-02, SOCK-03)
import { Ticket } from "../models/Ticket.js";
import { isValidId } from "../utils/validators.js";

// Returns the ticket if the user may access it, otherwise null.
// Customers: only their own tickets. Agents: any ticket.
// We return null for BOTH "does not exist" and "belongs to someone else", so callers answer 404 in both cases
// and never reveal that another customer's ticket exists. (BE-09)
export async function findAccessibleTicket(ticketId, user) {
  if (!isValidId(ticketId)) return null;
  const ticket = await Ticket.findById(ticketId).populate("customerId", "name email");
  if (!ticket) return null;
  if (user.role === "customer" && ticket.customerId._id.toString() !== user.id) return null;
  return ticket;
}
