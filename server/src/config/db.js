// FILE: config/db.js
// Responsibility: connect Mongoose to the hosted MongoDB (Atlas). (BE-02)
import mongoose from "mongoose";

export async function connectDb(uri) {
  if (mongoose.connection.readyState !== 0) return; // already connected or connecting
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
