// FILE: server.js
// Responsibility: start everything: DB connection, HTTP server, Socket.IO. Run with "npm start".
import http from "http";
import { env, assertRequiredEnv } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { createApp } from "./app.js";
import { attachSocketServer } from "./sockets/index.js";

async function start() {
  assertRequiredEnv();
  await connectDb(env.mongoUri);

  // Socket.IO must share the SAME http server as Express.
  const httpServer = http.createServer(createApp());
  attachSocketServer(httpServer);

  httpServer.listen(env.port, () => console.log(`Server listening on port ${env.port}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
