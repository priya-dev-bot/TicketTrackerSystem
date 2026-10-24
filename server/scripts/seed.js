// FILE: scripts/seed.js
// Responsibility: create/update the two demo accounts. Safe to run many times (upsert by email -> no duplicates).
// Requirements: AUTH-01, AUTH-03, AUTH-04. Passwords come from env vars, so they are never committed.
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env, assertRequiredEnv } from "../src/config/env.js";
import { connectDb } from "../src/config/db.js";
import { User } from "../src/models/User.js";

async function upsertUser({ name, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10); // 10 salt rounds
  // updateOne with upsert: update if email exists, otherwise create. Running twice never duplicates.
  await User.updateOne({ email: email.toLowerCase() }, { $set: { name, role, passwordHash } }, { upsert: true });
  console.log(`Seeded ${role}: ${email}`);
}

async function main() {
  assertRequiredEnv();
  const { SEED_CUSTOMER_EMAIL, SEED_CUSTOMER_PASSWORD, SEED_AGENT_EMAIL, SEED_AGENT_PASSWORD } = process.env;
  if (!SEED_CUSTOMER_EMAIL || !SEED_CUSTOMER_PASSWORD || !SEED_AGENT_EMAIL || !SEED_AGENT_PASSWORD) {
    throw new Error("Set SEED_CUSTOMER_EMAIL/PASSWORD and SEED_AGENT_EMAIL/PASSWORD in your environment first.");
  }
  await connectDb(env.mongoUri);
  await User.init(); // make sure the unique email index exists
  await upsertUser({ name: "Demo Customer", email: SEED_CUSTOMER_EMAIL, password: SEED_CUSTOMER_PASSWORD, role: "customer" });
  await upsertUser({ name: "Demo Support Agent", email: SEED_AGENT_EMAIL, password: SEED_AGENT_PASSWORD, role: "agent" });
  // Optional second customer, only for demonstrating that one customer cannot open another's ticket.
  if (process.env.SEED_CUSTOMER2_EMAIL && process.env.SEED_CUSTOMER2_PASSWORD) {
    await upsertUser({ name: "Second Customer", email: process.env.SEED_CUSTOMER2_EMAIL, password: process.env.SEED_CUSTOMER2_PASSWORD, role: "customer" });
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
