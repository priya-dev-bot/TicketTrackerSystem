// FILE: routes/index.js
// Responsibility: map URLs to controllers and attach the right middleware to each. (REST API in README)
import { upload } from "../middleware/upload.js";
import { downloadAttachment } from "../controllers/ticketController.js";
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { loginLimiter, registerLimiter } from "../middleware/loginLimiter.js";
import { login, register, logout, me } from "../controllers/authController.js";
import { listTickets, createTicket, getTicket, updateStatus, updatePriority } from "../controllers/ticketController.js";
import { postMessage } from "../controllers/messageController.js";

const router = Router();

// Public
router.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
router.post("/auth/login", loginLimiter, login);

// Everything below requires a valid token (authentication)
router.post("/auth/register", registerLimiter, register);
router.use(requireAuth);
router.post("/auth/logout", logout);
router.get("/auth/me", me);

router.get("/tickets", listTickets);
router.post("/tickets", upload.array("files", 3), createTicket);   // was: router.post("/tickets", createTicket)
router.get("/tickets/:id/attachments/:attId", downloadAttachment); // new
router.get("/tickets/:id", getTicket);
router.post("/tickets/:id/messages", postMessage);

// Agent-only routes (authorization by role): a customer calling these directly gets 403.
router.patch("/tickets/:id/status", requireRole("agent"), updateStatus);
router.patch("/tickets/:id/priority", requireRole("agent"), updatePriority);

export default router;
