// FILE: models/Message.js
// Responsibility: one reply in a ticket conversation. Satisfies RT-03, BE-08.
// Messages are a separate collection; the index on (ticketId, createdAt) keeps ordering fast and reliable.
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ ticketId: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
