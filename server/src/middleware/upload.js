// Reads multipart/form-data. Files are kept in memory, then saved to MongoDB by the controller.
import multer from "multer";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 3 }, // 2 MB each, max 3 files
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    const err = new Error("Only images (JPG, PNG, WebP), PDF, Word and text files are allowed");
    err.code = "UNSUPPORTED_FILE";
    cb(err);
  },
});