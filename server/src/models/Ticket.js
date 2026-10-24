// FILE: models/Ticket.js
// Responsibility: shape of a support ticket. Satisfies BE-08, CUST-01.
import mongoose from "mongoose";
import { STATUSES, PRIORITIES } from "../services/ticketRules.js";

const ticketSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    // Reference to the owner. Always set from the verified JWT, never from the request body.
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: STATUSES, default: "Open" },
    priority: { type: String, enum: PRIORITIES, default: "Medium" },
  },
  // timestamps:true gives createdAt and updatedAt automatically (updatedAt = "last updated time").
  { timestamps: true }
);

export const Ticket = mongoose.model("Ticket", ticketSchema);
