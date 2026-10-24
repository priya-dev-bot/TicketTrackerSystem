// FILE: models/User.js
// Responsibility: shape of a user document. Satisfies AUTH-01, AUTH-04, BE-08.
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // unique:true creates a MongoDB unique index so two users cannot share an email.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Only the bcrypt HASH is stored, never the plaintext password.
    // select:false means queries do NOT return it unless we ask explicitly (extra safety).
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "agent"], required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
