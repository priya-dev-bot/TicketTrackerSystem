
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { getErrorMessage } from "../services/api.js";
import Notice from "../components/Notice.jsx";

const MAX_FILES = 3;
const MAX_SIZE = 2 * 1024 * 1024;

const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export default function CreateTicket() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleFiles(e) {
    const combined = [...files, ...Array.from(e.target.files)];
    e.target.value = "";

    if (combined.length > MAX_FILES) {
      setFileError(`You can attach up to ${MAX_FILES} files.`);
      return;
    }

    const bad = combined.find((f) => !ALLOWED.includes(f.type));
    if (bad) {
      setFileError(`"${bad.name}" is not an allowed file type.`);
      return;
    }

    const big = combined.find((f) => f.size > MAX_SIZE);
    if (big) {
      setFileError(`"${big.name}" is larger than 2 MB.`);
      return;
    }

    setFileError("");
    setFiles(combined);
  }

  function removeFile(index) {
    setFiles((previous) => previous.filter((_, i) => i !== index));
    setFileError("");
  }

  function validate() {
    const errors = {};
    const s = subject.trim();
    const d = description.trim();

    if (s.length === 0) errors.subject = "Subject is required.";
    else if (s.length < 3 || s.length > 120)
      errors.subject = "Subject must be 3 to 120 characters.";

    if (d.length === 0) errors.description = "Description is required.";
    else if (d.length < 10 || d.length > 2000)
      errors.description = "Description must be 10 to 2000 characters.";

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("description", description);

      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await api.post("/tickets", formData);

      navigate(`/tickets/${res.data.ticket._id}`, {
        state: {
          notice: "Ticket created. Our team will reply here.",
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <section className="create-ticket-page">
      <div className="create-ticket-hero">
        <div>
          <span className="create-ticket-eyebrow">
            INSTAPORT SUPPORT
          </span>
          <h1>How can we help you?</h1>
          <p>
            Tell us what you need help with. Our support team will
            review your request and get back to you.
          </p>
        </div>

        <div className="create-ticket-hero-icon" aria-hidden="true">
          <span>+</span>
        </div>
      </div>

      <div className="create-ticket-card">
        <div className="create-ticket-card-heading">
          <div>
            <h2>Create a support ticket</h2>
            <p>Describe your issue so we can help you faster.</p>
          </div>

          <span className="create-ticket-status">New request</span>
        </div>

        <div className="create-ticket-info">
          <span className="create-ticket-info-icon" aria-hidden="true">
            i
          </span>
          <p>
            Your ticket will start with <strong>Open</strong> status
            and <strong>Medium</strong> priority.
          </p>
        </div>

        <Notice type="error">{error}</Notice>

        <form onSubmit={handleSubmit} noValidate className="create-ticket-form">
          <div className="create-ticket-field">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              className="create-ticket-input"
              value={subject}
              maxLength={200}
              placeholder="e.g. Unable to track my delivery"
              onChange={(e) => setSubject(e.target.value)}
              aria-invalid={!!fieldErrors.subject}
              aria-describedby="subject-err"
            />
            <p id="subject-err" className="field-error">
              {fieldErrors.subject}
            </p>
          </div>

          <div className="create-ticket-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              className="create-ticket-input create-ticket-textarea"
              rows={6}
              value={description}
              placeholder="Explain what happened and include any useful details..."
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={!!fieldErrors.description}
              aria-describedby="description-err"
            />
            <div className="create-ticket-description-footer">
              <p id="description-err" className="field-error">
                {fieldErrors.description}
              </p>
              <span>{description.length}/2000</span>
            </div>
          </div>

          <div className="create-ticket-field">
            <label htmlFor="files">Attachments <span>(optional)</span></label>

            <div className="create-ticket-upload">
              <div className="create-ticket-upload-icon" aria-hidden="true">
                ↑
              </div>

              <p className="create-ticket-upload-title">
                Attach files to your ticket
              </p>
              <p className="create-ticket-upload-help">
                JPG, PNG, WEBP, PDF, Word or TXT · Up to 3 files · 2 MB each
              </p>

              <input
                id="files"
                className="create-ticket-file-input"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
                onChange={handleFiles}
              />
            </div>

            <p className="field-error" role="alert">
              {fileError}
            </p>

            {files.length > 0 && (
              <ul className="create-ticket-file-list">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`}>
                    <span className="create-ticket-file-icon" aria-hidden="true">
                      ↳
                    </span>
                    <span className="create-ticket-file-details">
                      <strong>{file.name}</strong>
                      <small>{Math.ceil(file.size / 1024)} KB</small>
                    </span>

                    <button
                      type="button"
                      className="link-btn create-ticket-remove"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="create-ticket-actions">
            <Link to="/customer" className="btn btn-light">
              Cancel
            </Link>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create ticket →"}
            </button>
          </div>
        </form>
      </div>

      <p className="create-ticket-footer">
        Need help? Submit your request and our support team will assist you.
      </p>
    </section>
  );
}
