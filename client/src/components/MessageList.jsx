// FILE: components/MessageList.jsx - the conversation, oldest first, with sender name, role and time. (RT-04)
export default function MessageList({ messages }) {
  if (messages.length === 0) {
    return <p className="empty-small">No replies yet. Send the first reply below.</p>;
  }
  return (
    <ol className="messages" aria-label="Conversation">
      {messages.map((m) => (
        <li key={m._id} className={`message ${m.sender.role === "agent" ? "from-agent" : "from-customer"}`}>
          <div className="message-head">
            <strong>{m.sender.name}</strong>
            <span className="role-chip">{m.sender.role === "agent" ? "Support Agent" : "Customer"}</span>
            <time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleString()}</time>
          </div>
          {/* React escapes this text, so HTML typed by a user is shown as text, not executed. */}
          <p className="message-body">{m.body}</p>
        </li>
      ))}
    </ol>
  );
}
