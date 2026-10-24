// FILE: controllers/ticketController.js
// Responsibility: list/create/read tickets and agent-only status/priority changes.
// Requirements: CUST-01..07, AGENT-01..03, AUTH-05, BE-04, BE-06.
import { Ticket } from "../models/Ticket.js";
import { Message } from "../models/Message.js";
import { STATUSES, PRIORITIES, checkStatusChange } from "../services/ticketRules.js";
import { findAccessibleTicket } from "../services/ticketAccess.js";
import { cleanText, isValidId, LIMITS } from "../utils/validators.js";
import { ticketToJson, messageToJson } from "./serializers.js";
import { emitToTicket } from "../sockets/io.js";
import { Attachment } from "../models/Attachment.js";

// GET /api/tickets?status=Open
export async function listTickets(req, res, next) {
  try {
    const query = {};

    // Optional status filter ("All" means no filter). Validate against the allowed list.
    const { status } = req.query;
    if (status && status !== "All") {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({ message: `Status filter must be All or one of: ${STATUSES.join(", ")}` });
      }
      query.status = status;
    }

    // Customers ONLY see their own tickets - the id comes from the verified token, not from the URL.
    // Agents get no customer filter, so they see every customer's tickets.
    if (req.user.role === "customer") {
      query.customerId = req.user.id;
    }

    const tickets = await Ticket.find(query).sort({ updatedAt: -1 }).populate("customerId", "name email");
    res.status(200).json({ tickets: tickets.map(ticketToJson) });
  } catch (err) {
    next(err);
  }
}

// POST /api/tickets  (customers create tickets)
export async function createTicket(req, res, next) {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Only customers can create tickets" });
    }

    const subject = cleanText(req.body.subject, "Subject", LIMITS.subject);
    if (subject.error) return res.status(400).json({ message: subject.error });
    const description = cleanText(req.body.description, "Description", LIMITS.description);
    if (description.error) return res.status(400).json({ message: description.error });

    // customerId comes from the verified JWT. status/priority are fixed defaults:
    // anything the client sends for customerId/status/priority is ignored.
    const ticket = await Ticket.create({
      subject: subject.value,
      description: description.value,
      customerId: req.user.id,
      status: "Open",
      priority: "Medium",
    });

        // Save any uploaded files (req.files comes from multer). Owner is the logged-in user.
    const files = req.files || [];
    if (files.length > 0) {
      await Attachment.insertMany(
        files.map((f) => ({
          ticketId: ticket._id,
          uploadedBy: req.user.id,
          originalName: f.originalname.slice(0, 200),
          mimeType: f.mimetype,
          size: f.size,
          data: f.buffer,
        }))
      );
    }

    const saved = await Ticket.findById(ticket._id).populate("customerId", "name email");
    res.status(201).json({ ticket: ticketToJson(saved) });
  } catch (err) {
    next(err);
  }
}

// GET /api/tickets/:id  -> ticket + conversation in chronological order
export async function getTicket(req, res, next) {
  try {
    // Shared ownership check. Returns null when missing OR not yours -> 404 either way (BE-09).
    const ticket = await findAccessibleTicket(req.params.id, req.user);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Oldest first; _id is a tie-breaker for messages created in the same millisecond.
    const messages = await Message.find({ ticketId: ticket._id })
      .sort({ createdAt: 1, _id: 1 })
      .populate("senderId", "name role");
      

        const attachments = await Attachment.find({ ticketId: ticket._id }).sort({ createdAt: 1 });

    res.status(200).json({
      ticket: ticketToJson(ticket),
      attachments: attachments.map((a) => ({
        _id: a._id.toString(), originalName: a.originalName, mimeType: a.mimeType, size: a.size,
      })),
      messages: messages.map((m) =>
        messageToJson(m, { id: m.senderId._id.toString(), name: m.senderId.name, role: m.senderId.role })
      ),
    });
  } catch (err) {
    next(err);
  }
}

// Loads a ticket for an agent-only update. (Route already guarantees role === agent.)
async function loadTicketForAgent(req, res) {
  if (!isValidId(req.params.id)) {
    res.status(400).json({ message: "Invalid ticket id" });
    return null;
  }
  const ticket = await Ticket.findById(req.params.id).populate("customerId", "name email");
  if (!ticket) {
    res.status(404).json({ message: "Ticket not found" });
    return null;
  }
  return ticket;
}

// PATCH /api/tickets/:id/status  (agent only)
export async function updateStatus(req, res, next) {
  try {
    const ticket = await loadTicketForAgent(req, res);
    if (!ticket) return;

    // Rule: Open -> In Progress -> Resolved only. No skipping, no reopening.
    const result = checkStatusChange(ticket.status, req.body.status);
    if (!result.ok) return res.status(400).json({ message: result.message });

    ticket.status = req.body.status;
    await ticket.save(); // saved in MongoDB first...
    const json = ticketToJson(ticket);
    emitToTicket(ticket._id, "ticket:updated", json); // ...then viewers in the room are told
    res.status(200).json({ ticket: json });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/tickets/:id/priority  (agent only)
export async function updatePriority(req, res, next) {
  try {
    const ticket = await loadTicketForAgent(req, res);
    if (!ticket) return;

    if (!PRIORITIES.includes(req.body.priority)) {
      return res.status(400).json({ message: `Priority must be one of: ${PRIORITIES.join(", ")}` });
    }

    ticket.priority = req.body.priority;
    await ticket.save();
    const json = ticketToJson(ticket);
    emitToTicket(ticket._id, "ticket:updated", json);
    res.status(200).json({ ticket: json });
  } catch (err) {
    next(err);
  }
}

// GET /api/tickets/:id/attachments/:attId
// Same ownership rule as the ticket itself: a customer cannot download another customer's file.
export async function downloadAttachment(req, res, next) {
  try {
    const ticket = await findAccessibleTicket(req.params.id, req.user);
    if (!ticket || !isValidId(req.params.attId)) return res.status(404).json({ message: "File not found" });

    // data is select:false, so we must ask for it explicitly.
    const file = await Attachment.findOne({ _id: req.params.attId, ticketId: ticket._id }).select("+data");
    if (!file) return res.status(404).json({ message: "File not found" });

    res.set({
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
      "X-Content-Type-Options": "nosniff", // browser must not guess a different type
    });
    res.send(file.data);
  } catch (err) {
    next(err);
  }
}983393
