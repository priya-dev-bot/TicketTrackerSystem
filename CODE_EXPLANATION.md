# Code Explanation (beginner-friendly)

Use this to explain the project in your own words. Each section: **what / why / how / example / requirement / how to say it**.

## The big picture in 5 sentences
The browser (React) shows pages. When you click something, React calls the Express API with Axios and sends your JWT. Express checks the JWT (who are you?) and the rules (what may you do?), then reads or writes MongoDB. After a reply is saved, the server tells everyone allowed in that ticket's Socket.IO room. React shows the new message without a refresh.

## Message flow (the most asked interview question)
1. Customer types a reply and clicks **Send reply** (`TicketDetail.jsx → sendReply`).
2. Axios sends `POST /api/tickets/:id/messages` with `Authorization: Bearer <JWT>`.
3. `requireAuth` verifies the JWT → `req.user`.
4. `postMessage` calls `findAccessibleTicket` (ownership check) → 404 if not allowed.
5. `cleanText` trims and validates 1–2000 characters → 400 if bad.
6. `Message.create({ senderId: req.user.id ... })` **saves to MongoDB**.
7. Only now `emitToTicket` sends `message:new` to room `ticket:<id>`.
8. The HTTP response (201) returns the saved message to the sender; the socket event reaches other viewers.
9. React `mergeMessages` ignores a message whose `_id` is already on screen → no duplicates.

## Server files
**`config/env.js`** – Reads `.env` once and exports settings. *Why:* secrets must not be in code. `assertRequiredEnv()` stops the server if `JWT_SECRET` or `MONGODB_URI` is missing. *Say:* "All configuration comes from environment variables, so nothing sensitive is committed." (AUTH-09, DEPLOY-07)

**`config/db.js`** – `mongoose.connect(uri)` to Atlas. Does not log the URI because it contains the password.

**`models/User.js`** – name, unique email, `passwordHash` (hidden by `select:false`), role `customer|agent`. *Say:* "We never store plain passwords; only a bcrypt hash." (AUTH-04)

**`models/Ticket.js`** – subject, description, `customerId` (reference to User), status default `Open`, priority default `Medium`, `timestamps` (updatedAt = last updated). Enums stop invalid values being saved.

**`models/Message.js`** – ticketId, senderId, body, createdAt, plus an index on `(ticketId, createdAt)` so conversations load in order quickly. Separate collection = easy history and ordering.

**`services/ticketRules.js`** – `checkStatusChange(current, requested)`. A map says Open→In Progress, In Progress→Resolved, Resolved→nothing. Anything else returns an error message. *Example:* Open→Resolved = "can only move from Open to In Progress". One copy of the rule, used by the controller. (AGENT-02)

**`utils/validators.js`** – `cleanText` (trim, reject blank, min/max) and `isValidId` (24-hex check). *Why:* so every endpoint validates the same way. (BE-04)

**`middleware/auth.js`** – `verifyToken` uses `jwt.verify` (signature + expiry), then reloads the user. `requireAuth` reads `Authorization: Bearer ...`, calls it, sets `req.user`, or answers 401. The same `verifyToken` is used by sockets. *Say:* "Authentication answers *who are you*."

**`middleware/requireRole.js`** – returns 403 unless `req.user.role` matches. Used on status/priority routes. *Say:* "Authorization answers *what may you do*. Hiding a button in React is not security; this is."

**`middleware/loginLimiter.js`** – max failed logins per IP per 15 min → 429. Successful logins are not counted.

**`middleware/errorHandler.js`** – one place that returns `{message}` JSON. Unexpected errors log on the server and return a generic 500 – no stack trace to the client.

**`services/ticketAccess.js`** – `findAccessibleTicket(id, user)`: invalid id → null; not found → null; customer and not the owner → null; otherwise the ticket. Returning null for "not yours" and "doesn't exist" lets the controller answer 404 for both, so nothing leaks. Used by HTTP **and** socket join. (AUTH-05, SOCK-02/03)

**`controllers/authController.js`** – `login`: find user, `bcrypt.compare`, same 401 message for unknown email or wrong password (plus a dummy hash comparison so timing is similar), `jwt.sign({id}, secret, {expiresIn})`. `logout` is a no-op acknowledgement (JWT is stateless; the browser discards the token). `me` returns `req.user`.

**`controllers/ticketController.js`** – `listTickets` (customer filter uses `req.user.id`, agents unfiltered, optional validated status), `createTicket` (owner from the token; status/priority forced to Open/Medium; extra body fields ignored), `getTicket` (ticket + messages sorted oldest first), `updateStatus` / `updatePriority` (agent only: validate → save → emit `ticket:updated`).

**`controllers/messageController.js`** – `postMessage` as described in the flow. It never looks at ticket status, so replies on Resolved tickets work and do not reopen anything. (CUST-07)

**`controllers/serializers.js`** – chooses exactly which fields are returned (never passwordHash).

**`routes/index.js`** – maps URLs → middleware → controllers. `router.use(requireAuth)` protects everything below it.

**`sockets/index.js`** – `io.use` = handshake auth (needs `auth.token`; invalid/expired refused). On connect: a timer disconnects the socket when its token expires. `ticket:join` → `findAccessibleTicket` → `socket.join(room)` or `{ok:false}`. No write events exist. *Say:* "Even if someone knows a ticket ID, the server checks ownership before joining the room."

**`sockets/io.js`** – holds the `io` object so controllers can call `emitToTicket` without circular imports.

**`app.js` / `server.js`** – `app.js` builds Express (CORS with the allowed origin only, JSON parser limit, routes, error handler). `server.js` connects DB, creates one HTTP server shared by Express and Socket.IO, and listens.

**`scripts/seed.js`** – hashes the passwords from env and `updateOne(... {upsert:true})` by email → running twice never duplicates. (AUTH-03)

## Client files
**`services/api.js`** – Axios instance using `VITE_API_BASE_URL`; adds the JWT header; on a 401 from any protected call it triggers logout; `getErrorMessage` converts errors to readable text.

**`services/socket.js`** – `connectSocket(token)` opens one authenticated socket (`VITE_SOCKET_URL`); `disconnectSocket()` removes listeners and closes it.

**`context/AuthContext.jsx`** – holds `user`, `login`, `logout`. On load it restores a saved token via `/auth/me`. `logout` clears sessionStorage, token, user and disconnects the socket. Explains the sessionStorage trade-off in comments.

**`components/ProtectedRoute.jsx`** – not logged in → `/login`; wrong role → own dashboard. UX only; the backend enforces real rules.

**`hooks/useTicketSocket.js`** – on mount: listen for `message:new`/`ticket:updated`, emit `ticket:join`, rejoin on reconnect. On unmount: `socket.off(...)` and `ticket:leave` (cleanup, SOCK-08).

**`pages/TicketDetail.jsx`** – loads ticket + messages; `mergeMessages` removes duplicates by `_id`; reply form disables the button while sending and keeps text if sending fails; agent-only controls (priority select, one "Move to next status" button).

**`pages/CustomerDashboard.jsx`, `AgentDashboard.jsx`** – fetch `/tickets?status=` when the filter changes; show loading, error, empty and list states. `cancelled` flag avoids showing results from an old filter click.

**`pages/CreateTicket.jsx`** – client-side checks for friendliness, server re-validates; on failure the typed text stays.

**`pages/LoginPage.jsx`** – shows API errors (invalid login, 429) and the "session expired" message.

## Likely interview questions
- *Authentication vs authorization?* Who you are (JWT) vs what you may do (role + ownership).
- *Why re-check ownership on sockets?* Rooms are just names; without a check anyone who guesses an ID could listen.
- *Why save via HTTP and only deliver via sockets?* One validated write path; socket delivery is just notification.
- *How do you avoid duplicate messages?* Same MongoDB `_id` in the HTTP response and the socket event; React ignores IDs it already has.
- *What if a token is stolen?* Valid until expiry (1 h); no instant revocation with stateless JWT; mitigations/limits are documented.
- *Why 404 for another customer's ticket?* Does not reveal that the ticket exists.
- *Why bcrypt?* Slow salted hashing makes leaked hashes hard to crack.
- *Why sessionStorage?* See the trade-off in README (XSS risk vs cross-domain cookie complexity).
