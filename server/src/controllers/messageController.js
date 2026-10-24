// FILE: controllers/messageController.js
// Responsibility: save a reply, THEN broadcast it. Requirements: CUST-05, CUST-07, RT-01, RT-02, BE-06, SOCK-04, SOCK-05.
import { Message } from "../models/Message.js";
import { Ticket } from "../models/Ticket.js";
import { findAccessibleTicket } from "../services/ticketAccess.js";
import { cleanText, LIMITS } from "../utils/validators.js";
import { messageToJson } from "./serializers.js";
import { emitToTicket } from "../sockets/io.js";

// POST /api/tickets/:id/messages
export async function postMessage(req, res, next) {
  try {
    // 1) Authorization: customer must own the ticket; agents may reply to any ticket.
    const ticket = await findAccessibleTicket(req.params.id, req.user);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // 2) Validation: trim, reject blank, enforce 1-2000 characters.
    const reply = cleanText(req.body.body, "Reply", LIMITS.reply);
    if (reply.error) return res.status(400).json({ message: reply.error });

    // 3) Persist FIRST. senderId is the authenticated user - a senderId/role in the body is ignored.
    // Note: we do not look at ticket.status, so replying to a Resolved ticket works and does not reopen it.
    const message = await Message.create({
      ticketId: ticket._id,
      senderId: req.user.id,
      body: reply.value,
    });

    // Bump the ticket's "last updated" time so dashboards show recent activity.
    await Ticket.updateOne({ _id: ticket._id }, { $currentDate: { updatedAt: true } });

    // 4) Only AFTER saving do we broadcast, and only to the authorized ticket room.
    const json = messageToJson(message, req.user);
    emitToTicket(ticket._id, "message:new", json);

    // 5) The sender also gets the saved message in the HTTP response.
    // The frontend de-duplicates by _id because the sender may receive it twice (HTTP + socket).
    res.status(201).json({ message: json });
  } catch (err) {
    next(err);
  }
}
