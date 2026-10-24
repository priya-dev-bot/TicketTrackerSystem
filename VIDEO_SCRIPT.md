# Video Script – at least 30 minutes, one continuous recording

**Rules:** record your real screen, speak in your own words, hide `.env`, tokens, Atlas password and unrelated tabs (zoom the browser/editor font to ~150%). Only say you did something if you actually do it on screen. Replace anything in [brackets]. Add the timestamps below to your submission.

| Time | Section |
|---|---|
| 00:00–05:00 | 1 Project setup |
| 05:00–14:00 | 2 Backend walkthrough |
| 14:00–20:00 | 3 Frontend walkthrough |
| 20:00–26:00 | 4 Live demonstration |
| 26:00–30:00 | 5 Deployment and decisions |
(Targets – run a little over rather than under so the total is ≥ 30:00. Confirm final duration before submitting.)

## Part 1 – Setup (5 min)
**Do on screen:** create the folders in a terminal (`mkdir instaport-ticket-system`, `client`, `server`), `npm create vite@latest`/`npm init`, run `npm install` for both, create `.env` from `.env.example` **without showing values**, show `.gitignore`.
**Say:** "This is a support ticket system for Instaport. React gives a fast interface; Express on Node.js is the API; MongoDB stores users, tickets and messages; Socket.IO pushes new replies live. `client` is everything in the browser; `server` is the API. In `server/src`: models are data shapes, routes map URLs, controllers hold the logic, middleware does auth and errors, services hold reusable rules, sockets handles real-time. Secrets live in `.env`, which Git ignores; `.env.example` shows the names only."

## Part 2 – Backend (9 min) – open files in this order
1. 0:00 `models/*.js` – "User has a unique email and only a password *hash*. Ticket has status and priority with fixed allowed values. Message is separate so history is ordered by time."
2. 1:30 `authController.login` + `seed.js` – "bcrypt compares the typed password with the hash. Wrong email or password gives the same message. On success I sign a JWT with the user id that expires in one hour. The seed script uses upsert by email, so it is safe to run again."
3. 3:00 `middleware/auth.js`, `requireRole.js` – "Authentication proves who you are using the JWT; invalid or expired gives 401. Authorization decides what you may do; a customer on an agent route gets 403."
4. 4:00 `ticketAccess.js` + `ticketController.getTicket` – "Customers only get their own tickets. If it isn't yours I return 404, same as missing, so nothing leaks."
5. 5:00 `validators.js`, `ticketRules.js` – "Text is trimmed and blank is rejected. Limits: subject 3–120, description 10–2000, reply 1–2000. Status can only go Open→In Progress→Resolved."
6. 6:00 `messageController.postMessage` – trace the reply: "validate, save in MongoDB, then emit to the ticket room, then respond 201. Sender is `req.user`, never from the body."
7. 7:30 `sockets/index.js` – "Handshake needs a valid JWT. Joining a room re-checks ownership with the same function. Sockets cannot write. A timer disconnects at token expiry."
8. 8:30 `README` "Reproducible checks" – run a few of the curl commands live (blank subject 400, other customer 404, customer status change 403) and say what each proves.

## Part 3 – Frontend (6 min)
1. `App.jsx`, `ProtectedRoute.jsx` – "Routes per role; this is UX, the server enforces rules."
2. `AuthContext.jsx` – "Login stores the token in sessionStorage – say the trade-off. Logout clears state and disconnects the socket. A 401 anywhere logs the user out."
3. `services/api.js` – interceptors and `getErrorMessage`.
4. Dashboards – filters call `/tickets?status=`; loading, error and empty states.
5. `TicketDetail.jsx`, `useTicketSocket.js` – "join room, listen, clean up on leave; `mergeMessages` removes duplicates using the Mongo id; the button disables while sending and text is kept on failure."

## Part 4 – Live demo (6 min) – checklist
Invalid login → blank form validation → customer creates ticket (Open/Medium) → agent window opens it → customer replies (agent sees live) → agent replies (customer sees live) → agent priority + status steps → try to reopen (the button disappears after Resolved; mention the server rejects it with 400) → filters → refresh page → customer denied agent change (curl/console 403) → second customer (optional seeded account) cannot open the first customer's ticket URL → show the 404 curl check → explain the socket join denial in `sockets/index.js` (`ticket:join` returns `{ok:false}`).

## Part 5 – Deployment (4 min)
Show the live Vercel URL working, DevTools Network (Render API + websocket, no localhost), `/api/health`. Name (don't reveal) env vars: `MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_ORIGIN, VITE_API_BASE_URL, VITE_SOCKET_URL`. Explain: Vercel for static React, Render for a persistent Node + WebSocket server, Atlas for hosted DB; build/start commands; CORS equals the Vercel origin; limitations (README) and **AI usage** (say honestly how you used Claude and what you verified).
