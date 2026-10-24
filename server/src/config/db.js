// FILE: config/db.js
// Responsibility: connect Mongoose to the hosted MongoDB (Atlas). (BE-02)
import mongoose from "mongoose";

export async function connectDb(uri) {
  await mongoose.connect(uri);
  // We deliberately do NOT print the URI because it contains the database password.
  console.log("MongoDB connected");
}
