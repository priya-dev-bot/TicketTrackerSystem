// FILE: utils/validators.js
// Responsibility: reusable input validation (BE-04). Used by every controller.
import mongoose from "mongoose";

// Chosen length limits (documented in README):
export const LIMITS = {
  subject: { min: 3, max: 120 },
  description: { min: 10, max: 2000 },
  reply: { min: 1, max: 2000 },
};

// Trims text and checks length. Whitespace-only text becomes "" after trim and is rejected.
// Returns { value } on success or { error } on failure.
export function cleanText(input, label, limits) {
  if (typeof input !== "string") return { error: `${label} is required` };
  const value = input.trim();
  if (value.length === 0) return { error: `${label} cannot be blank` };
  if (value.length < limits.min) return { error: `${label} must be at least ${limits.min} characters` };
  if (value.length > limits.max) return { error: `${label} must be at most ${limits.max} characters` };
  return { value };
}

// Checks that a string is a valid MongoDB ObjectId BEFORE it is used in a query.
export function isValidId(id) {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id) && mongoose.Types.ObjectId.isValid(id);
}
