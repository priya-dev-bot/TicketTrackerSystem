// FILE: app.js
// Responsibility: build the Express app (middleware + routes). Kept separate from server.js so tests can import it.
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  // Behind Render's proxy, trust one proxy hop so rate limiting sees the real client IP.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  // CORS: only the configured frontend origin(s) may call the API (not "*"). (SOCK-07)
  app.use(cors({ origin: env.clientOrigins }));
  app.use(express.json({ limit: "20kb" }));

  app.use("/api", routes);
  app.use(notFound);
  app.use(errorHandler); // must be last
  return app;
}
