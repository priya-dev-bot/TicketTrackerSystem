// FILE: pages/CreateTicket.jsx - new ticket form. (CUST-01, UI-05)
// Validation here is for convenience; the server validates again and is the real gatekeeper.
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
    else if (s.length < 3 || s.length > 120) errors.subject = "Subject must be 3 to 120 characters.";
    if (d.length === 0) errors.description = "Description is required.";
    else if (d.length < 10 || d.length > 2000) errors.description = "Description must be 10 to 2000 characters.";
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
      navigate(`/tickets/${res.data.ticket._id}`, { state: { notice: "Ticket created. Our team will reply here." } });
    } catch (err) {
      // On failure we keep what the customer typed (state is untouched) and show the reason.
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <section className="card form-card">
      <h1>Create a ticket</h1>
      <p className="muted">New tickets start as Open with Medium priority.</p>
      <Notice type="error">{error}</Notice>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="subject">Subject</label>
        <input id="subject" value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)}
          aria-invalid={!!fieldErrors.subject} aria-describedby="subject-err" />
        <p id="subject-err" className="field-error">{fieldErrors.subject}</p>

        <label htmlFor="description">Description</label>
        <textarea id="description" rows={6} value={description} onChange={(e) => setDescription(e.target.value)}
          aria-invalid={!!fieldErrors.description} aria-describedby="description-err" />
        <p id="description-err" className="field-error">{fieldErrors.description}</p>

        <label htmlFor="files">Attachments (optional)</label>

<input
  id="files"
  type="file"
  multiple
  accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
  onChange={handleFiles}
/>

<p className="muted small">
  Up to 3 files, 2 MB each. Images, PDF, Word or text.
</p>

<p className="field-error" role="alert">
  {fileError}
</p>

{files.length > 0 && (
  <ul className="file-list">
    {files.map((file, index) => (
      <li key={`${file.name}-${index}`}>
        {file.name} ({Math.ceil(file.size / 1024)} KB)

        <button
          type="button"
          className="link-btn"
          onClick={() => removeFile(index)}
        >
          Remove
        </button>
      </li>
    ))}
  </ul>
)}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating..." : "Create ticket"}
          </button>
          <Link to="/customer" className="btn btn-light">Cancel</Link>
        </div>
      </form>
    </section>
  );
}
