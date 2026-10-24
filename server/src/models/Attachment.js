// Stores one uploaded file inside MongoDB. "data" is hidden unless we ask for it (select:false).
import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true, trim: true, maxlength: 200 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true, select: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Attachment = mongoose.model("Attachment", attachmentSchema);