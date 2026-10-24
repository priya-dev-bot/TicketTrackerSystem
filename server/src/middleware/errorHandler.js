// FILE: middleware/errorHandler.js
// Responsibility: ONE place that turns errors into consistent JSON. (BE-07, AUTH-13)
// We never send err.stack to the client.
export function notFound(req, res) {
  res.status(404).json({ message: "Route not found" });
}

// Express recognises error handlers by their 4 parameters, so "next" must stay even if unused.
export function errorHandler(err, req, res, next) {
  // Malformed JSON body from the client
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON body" });
    // File upload problems are the user's fault -> 400 with a clear message
  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Each file must be 2 MB or smaller"
      : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE" ? "You can attach up to 3 files"
      : "Invalid file upload";
    return res.status(400).json({ message });
  }
  if (err.code === "UNSUPPORTED_FILE") return res.status(400).json({ message: err.message });
  // Unexpected problem: log details on the SERVER only, send a generic message to the client.
  console.error("Unexpected error:", err);
  res.status(500).json({ message: "Something went wrong on the server" });
}
