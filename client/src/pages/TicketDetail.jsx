
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTicketSocket } from "../hooks/useTicketSocket.js";
import { StatusBadge, PriorityBadge } from "../components/Badge.jsx";
import MessageList from "../components/MessageList.jsx";
import Notice from "../components/Notice.jsx";
import { getSocket } from "../services/socket.js";

const NEXT_STATUS = { Open: "In Progress", "In Progress": "Resolved" };

function mergeMessages(current, incoming) {
  const seen = new Set(current.map((m) => m._id));
  const added = incoming.filter((m) => !seen.has(m._id));

  if (added.length === 0) return current;

  return [...current, ...added].sort(
    (a, b) =>
      new Date(a.createdAt) - new Date(b.createdAt) ||
      a._id.localeCompare(b._id)
  );
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
  const [success, setSuccess] = useState(
    (location.state && location.state.notice) || ""
  );
  const [agentError, setAgentError] = useState("");
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef(null);

  const loadTicket = useCallback(
    async (silent) => {
      if (!silent) {
        setLoading(true);
        setLoadError("");
      }

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
    },
    [id]
  );

  useEffect(() => {
    loadTicket(false);
  }, [loadTicket]);

  useTicketSocket(id, {
    onMessage: (m) => setMessages((prev) => mergeMessages(prev, [m])),
    onTicketUpdated: (t) => setTicket(t),
    onJoined: () => loadTicket(true),
  });

  useEffect(() => {
    if (getSocket()) return;

    const timer = setInterval(() => loadTicket(true), 5000);
    return () => clearInterval(timer);
  }, [loadTicket]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [messages.length]);

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

    if (reply.trim().length === 0) {
      setReplyError("Reply cannot be blank.");
      return;
    }

    setSending(true);

    try {
      const res = await api.post(`/tickets/${id}/messages`, {
        body: reply,
      });

      setMessages((prev) => mergeMessages(prev, [res.data.message]));
      setReply("");
      setSuccess("Reply sent.");
    } catch (err) {
      setReplyError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

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

  if (loading) {
    return (
      <section className="ticket-detail-page">
        <div className="ticket-detail-state" role="status">
          <span className="ticket-detail-spinner" />
          <h2>Loading your ticket</h2>
          <p>Please wait while we fetch the ticket details and conversation.</p>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="ticket-detail-page">
        <Link
          to={isAgent ? "/agent" : "/customer"}
          className="ticket-detail-back"
        >
          <span aria-hidden="true">←</span> Back to tickets
        </Link>

        <div className="ticket-detail-card">
          <Notice type="error">{loadError}</Notice>
          <Link
            to={isAgent ? "/agent" : "/customer"}
            className="btn btn-light"
          >
            Back to tickets
          </Link>
        </div>
      </section>
    );
  }

  const nextStatus = NEXT_STATUS[ticket.status];

  return (
    <section className="ticket-detail-page">
      <Link
        to={isAgent ? "/agent" : "/customer"}
        className="ticket-detail-back"
      >
        <span aria-hidden="true">←</span> Back to tickets
      </Link>

      <header className="ticket-detail-hero">
        <div className="ticket-detail-hero-content">
          <span className="ticket-detail-eyebrow">
            {isAgent ? "SUPPORT WORKSPACE" : "INSTAPORT SUPPORT"}
          </span>

          <h1>Ticket details</h1>

          <p>
            {isAgent
              ? "Review the issue, manage its status, and keep the customer updated."
              : "Track your support request and continue your conversation with our team."}
          </p>
        </div>

        <div className="ticket-detail-hero-icon" aria-hidden="true">
          <span>✓</span>
        </div>
      </header>

      <div className="ticket-detail-layout">
        <div className="ticket-detail-main">
          <article className="ticket-detail-card ticket-overview-card">
            <div className="ticket-detail-card-heading">
              <div>
                <span className="ticket-detail-kicker">SUPPORT REQUEST</span>
                <h2>{ticket.subject}</h2>
              </div>

              <span className="ticket-detail-id">
                #{String(ticket._id).slice(-6).toUpperCase()}
              </span>
            </div>

            <div className="ticket-detail-badges">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>

            {ticket.customer && (
              <div className="ticket-detail-customer">
                <div className="ticket-detail-avatar" aria-hidden="true">
                  {ticket.customer.name?.charAt(0)?.toUpperCase() || "C"}
                </div>

                <div>
                  <span className="ticket-detail-small-label">
                    {isAgent ? "CUSTOMER" : "YOUR REQUEST"}
                  </span>
                  <p className="ticket-detail-customer-name">
                    {ticket.customer.name}
                  </p>
                  <p className="ticket-detail-muted">
                    {ticket.customer.email}
                  </p>
                </div>

                <div className="ticket-detail-created">
                  <span className="ticket-detail-small-label">CREATED</span>
                  <p>{new Date(ticket.createdAt).toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="ticket-detail-divider" />

            <div className="ticket-detail-description">
              <h3>
                <span className="ticket-detail-heading-icon">✦</span>
                Original description
              </h3>
              <p className="message-body">{ticket.description}</p>
            </div>

            {attachments.length > 0 && (
              <div className="ticket-detail-attachments">
                <div className="ticket-detail-subheading">
                  <div>
                    <h3>Attachments</h3>
                    <p>Files included with this support request</p>
                  </div>
                  <span className="ticket-detail-file-count">
                    {attachments.length}{" "}
                    {attachments.length === 1 ? "file" : "files"}
                  </span>
                </div>

                <Notice type="error">{fileError}</Notice>

                <ul className="ticket-detail-file-list">
                  {attachments.map((file) => (
                    <li key={file._id} className="ticket-detail-file">
                      <span className="ticket-detail-file-icon" aria-hidden="true">
                        ↧
                      </span>

                      <div className="ticket-detail-file-info">
                        <span className="ticket-detail-file-name">
                          {file.originalName}
                        </span>
                        <span className="ticket-detail-muted">
                          {Math.ceil(file.size / 1024)} KB
                        </span>
                      </div>

                      <button
                        type="button"
                        className="ticket-detail-download"
                        onClick={() => downloadFile(file)}
                      >
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          <article className="ticket-detail-card ticket-conversation-card">
            <div className="ticket-detail-section-heading">
              <div>
                <span className="ticket-detail-kicker">MESSAGES</span>
                <h2>Conversation</h2>
                <p>All replies related to this support request.</p>
              </div>

              <span className="ticket-detail-chat-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </div>

            <div className="ticket-detail-messages">
              <MessageList messages={messages} />
              <div ref={bottomRef} />
            </div>

            <Notice type="success">{success}</Notice>

            <form
              onSubmit={sendReply}
              noValidate
              className="ticket-detail-reply-form"
            >
              <label htmlFor="reply">Write a reply</label>

              <textarea
                id="reply"
                rows={4}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your message here..."
                className="ticket-detail-reply-input"
              />

              <div className="ticket-detail-reply-footer">
                <span className="ticket-detail-reply-hint">
                  Please keep your message clear and helpful.
                </span>

                <button
                  type="submit"
                  className="btn btn-primary ticket-detail-send"
                  disabled={sending}
                >
                  {sending ? "Sending..." : "Send reply"}
                  {!sending && <span aria-hidden="true"> →</span>}
                </button>
              </div>

              <Notice type="error">{replyError}</Notice>
            </form>
          </article>
        </div>

        <aside className="ticket-detail-sidebar">
          <section className="ticket-detail-card ticket-status-card">
            <div className="ticket-detail-sidebar-heading">
              <span className="ticket-detail-sidebar-icon" aria-hidden="true">
                ✓
              </span>
              <div>
                <h2>Ticket status</h2>
                <p>Current progress</p>
              </div>
            </div>

            <div className="ticket-detail-current-status">
              <span className="ticket-detail-small-label">
                CURRENT STATUS
              </span>
              <div className="ticket-detail-status-badge">
                <StatusBadge status={ticket.status} />
              </div>
            </div>

            <div className="ticket-detail-current-status">
              <span className="ticket-detail-small-label">PRIORITY</span>
              <div className="ticket-detail-status-badge">
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>

            {isAgent ? (
              <div className="ticket-detail-agent-controls">
                <div className="ticket-detail-divider" />

                <span className="ticket-detail-kicker">AGENT ACTIONS</span>
                <h3>Manage ticket</h3>
                <p className="ticket-detail-muted">
                  Update the priority or move this request forward.
                </p>

                <Notice type="error">{agentError}</Notice>

                <label htmlFor="priority">Set priority</label>
                <select
                  id="priority"
                  value={ticket.priority}
                  disabled={saving}
                  onChange={(e) =>
                    changeTicket(
                      "priority",
                      { priority: e.target.value },
                      "Priority updated."
                    )
                  }
                  className="ticket-detail-priority-select"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>

                <div className="ticket-detail-status-action">
                  {nextStatus ? (
                    <button
                      type="button"
                      className="btn btn-primary ticket-detail-status-button"
                      disabled={saving}
                      onClick={() =>
                        changeTicket(
                          "status",
                          { status: nextStatus },
                          `Status changed to ${nextStatus}.`
                        )
                      }
                    >
                      {saving ? "Updating..." : `Move to ${nextStatus}`}
                    </button>
                  ) : (
                    <p className="ticket-detail-resolved">
                      ✓ This ticket is resolved and cannot be reopened.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="ticket-detail-help-note">
                <span aria-hidden="true">✦</span>
                <p>
                  Need to add more information? Send a reply in the
                  conversation and our support team will follow up.
                </p>
              </div>
            )}
          </section>

          <section className="ticket-detail-help-card">
            <span className="ticket-detail-help-symbol" aria-hidden="true">
              ?
            </span>
            <h3>Need more help?</h3>
            <p>
              Keep all updates and replies in this ticket so the support team
              can help you faster.
            </p>
            <Link
              to={isAgent ? "/agent" : "/customer"}
              className="ticket-detail-secondary-link"
            >
              View all tickets <span aria-hidden="true">→</span>
            </Link>
          </section>
        </aside>
      </div>
    </section>
  );
}
