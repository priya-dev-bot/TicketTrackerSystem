// Vercel entry point: runs the same Express app as a serverless function.
import { env, assertRequiredEnv } from "../src/config/env.js";
import { connectDb } from "../src/config/db.js";
import { createApp } from "../src/app.js";

assertRequiredEnv();
const app = createApp();
const dbReady = connectDb(env.mongoUri); // connects once, reused while the function is warm

export default async function handler(req, res) {
  try {
    await dbReady;
    return app(req, res);
  } catch (err) {
    console.error("DB connection failed:", err.message);
    res.status(500).json({ message: "Something went wrong on the server" });
  }
}