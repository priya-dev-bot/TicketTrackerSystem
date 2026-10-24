// FILE: pages/TicketDetail.jsx - one ticket: description, conversation, reply form, agent controls.
// Requirements: CUST-04..06, AGENT-02..04, RT-01..05, SOCK-08.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTicketSocket } from "../hooks/useTicketSocket.js";
import { StatusBadge, PriorityBadge } from "../components/Badge.jsx";
import MessageList from "../components/MessageList.jsx";
import Notice from "../components/Notice.jsx";

const NEXT_STATUS = { Open: "In Progress", "In Progress": "Resolved" };

// Add messages to the list WITHOUT duplicates. The Mongo _id is the same in the HTTP response and the socket event.
function mergeMessages(current, incoming) {
  const seen = new Set(current.map((m) => m._id));
  const added = incoming.filter((m) => !seen.has(m._id));
  if (added.length === 0) return current;
  return [...current, ...added].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt) || a._id.localeCompare(b._id));
}

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const isAgent = user.role === "agent";

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [attachments, setAttachments] = useState([]);
const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [success, setSuccess] = useState((location.state && location.state.notice) || "");
  const [agentError, setAgentError] = useState("");
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef(null);

  // Load ticket + conversation from the server. "silent" = no loading screen (used after joining the room).
  const loadTicket = useCallback(async (silent) => {
    if (!silent) { setLoading(true); setLoadError(""); }
    try {
      const res = await api.get(`/tickets/${id}`);

setTicket(res.data.ticket);
setAttachments(res.data.attachments || []);

setMessages((prev) =>
  silent ? mergeMessages(prev, res.data.messages) : res.data.messages
);
    } catch (err) {
      if (!silent) setLoadError(getErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadTicket(false); }, [loadTicket]);

  // Real-time: join this ticket's room and listen. The hook cleans up when we leave the page.
  useTicketSocket(id, {
    onMessage: (m) => setMessages((prev) => mergeMessages(prev, [m])),
    onTicketUpdated: (t) => setTicket(t),
    onJoined: () => loadTicket(true), // catches any reply sent before the room was joined
  });

  // Scroll to the newest message.
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  // Download the file using the logged-in user's authentication.
async function downloadFile(file) {
  setFileError("");

  try {
    const res = await api.get(
      `/tickets/${id}/attachments/${file._id}`,
      { responseType: "blob" }
    );

    const url = URL.createObjectURL(res.data);
    const link = document.createElement("a");

    link.href = url;
    link.download = file.originalName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  } catch (err) {
    setFileError("Could not download this file. Please try again.");
  }
}

  async function sendReply(event) {
    event.preventDefault();
    setReplyError("");
    setSuccess("");
    if (reply.trim().length === 0) { setReplyError("Reply cannot be blank."); return; }
    setSending(true);
    try {
      const res = await api.post(`/tickets/${id}/messages`, { body: reply });
      // The socket event may deliver the same message too; mergeMessages ignores the duplicate.
      setMessages((prev) => mergeMessages(prev, [res.data.message]));
      setReply("");
      setSuccess("Reply sent.");
    } catch (err) {
      setReplyError(getErrorMessage(err)); // reply text stays in the box
    } finally {
      setSending(false);
    }
  }

  // Agent-only actions. (The server rejects them for customers even if someone calls the API directly.)
  async function changeTicket(path, payload, okMessage) {
    setAgentError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await api.patch(`/tickets/${id}/${path}`, payload);
      setTicket(res.data.ticket);
      setSuccess(okMessage);
    } catch (err) {
      setAgentError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="page-message" role="status">Loading ticket...</p>;
  if (loadError) {
    return (
      <section>
        <Notice type="error">{loadError}</Notice>
        <Link to={isAgent ? "/agent" : "/customer"} className="btn btn-light">Back to tickets</Link>
      </section>
    );
  }

  const nextStatus = NEXT_STATUS[ticket.status];

  return (
    <section>
      <Link to={isAgent ? "/agent" : "/customer"} className="back-link">Back to tickets</Link>
      <div className="card">
        <div className="page-head">
          <h1>{ticket.subject}</h1>
          <div className="ticket-meta">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
        {ticket.customer && <p className="muted">From {ticket.customer.name} ({ticket.customer.email}) on {new Date(ticket.createdAt).toLocaleString()}</p>}
        <h2>Original description</h2>
        <p className="message-body">{ticket.description}</p>
        {attachments.length > 0 && (
  <>
    <h2>Attachments</h2>

    <Notice type="error">{fileError}</Notice>

    <ul className="file-list">
      {attachments.map((file) => (
        <li key={file._id}>
          <button
            type="button"
            className="link-btn"
            onClick={() => downloadFile(file)}
          >
            {file.originalName}
          </button>

          <span className="muted">
            ({Math.ceil(file.size / 1024)} KB)
          </span>
        </li>
      ))}
    </ul>
  </>
)}
        {isAgent && (
          <div className="agent-controls">
            <h2>Manage ticket</h2>
            <Notice type="error">{agentError}</Notice>
            <div className="agent-row">
              <div>
                <label htmlFor="priority">Priority</label>
                <select id="priority" value={ticket.priority} disabled={saving}
                  onChange={(e) => changeTicket("priority", { priority: e.target.value }, "Priority updated.")}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div>
                <span className="label-like">Status</span>
                {nextStatus ? (
                  <button type="button" className="btn btn-primary" disabled={saving}
                    onClick={() => changeTicket("status", { status: nextStatus }, `Status changed to ${nextStatus}.`)}>
                    Move to {nextStatus}
                  </button>
                ) : (
                  <span className="muted">Resolved. This ticket cannot be reopened.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Conversation</h2>
        <MessageList messages={messages} />
        <div ref={bottomRef} />
        <Notice type="success">{success}</Notice>
        <form onSubmit={sendReply} noValidate className="reply-form">
          <label htmlFor="reply">Your reply</label>
          <textarea id="reply" rows={4} value={reply} onChange={(e) => setReply(e.target.value)} />
          <Notice type="error">{replyError}</Notice>
          <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? "Sending..." : "Send reply"}</button>
        </form>
      </div>
    </section>
  );
}
