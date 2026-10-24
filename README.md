# Instaport Delivery – Mini Support Ticket System

A MERN + Socket.IO support ticket app with two roles: **Customer** and **Support Agent**.
Customers create tickets and chat with support. Agents see every ticket, reply, set priority and move status forward.

> **Status:** the backend behaviour was checked end-to-end with the `curl` checks below. The React UI is built and compiles, but you should click through it once in a browser. **Deployment is not done yet** – it needs your Atlas, Render and Vercel accounts (steps below). Live URLs: `TODO – add after you deploy and verify`.

## Features
- JWT login, bcrypt password hashes, role-based access, ticket-ownership checks (server enforced)
- Customer: create ticket (starts **Open / Medium**), list own tickets, filter All/Open/In Progress/Resolved, view conversation, reply
- Agent: see all tickets with customer name, filter, reply, set priority (Low/Medium/High), move status Open → In Progress → Resolved (no skipping, no reopening)
- Replies saved in MongoDB, delivered live with Socket.IO, no duplicates (de-duplicated by Mongo `_id`)
- Both roles may reply to Resolved tickets (does not reopen)
- Login rate limiting, restricted CORS, consistent JSON errors, no stack traces
- Loading / empty / success / error states, responsive layout, visible focus, text-labelled badges

## Tech stack
React (Vite) · React Router · Axios · Socket.IO client · Node.js · Express · Mongoose · MongoDB Atlas · jsonwebtoken · bcryptjs · express-rate-limit · Socket.IO

## Architecture
```
React (Vercel) ──HTTPS──> Express API (Render) ──> MongoDB Atlas
      └───────WebSocket (Socket.IO, JWT in handshake)──┘
```
Reply flow: customer types → `POST /api/tickets/:id/messages` (JWT) → server checks ownership + validates → **saves to MongoDB** → emits `message:new` to room `ticket:<id>` → other authorised viewers update instantly; the sender de-duplicates by `_id`.

## Project structure
```
client/src/  components/ pages/ services/(api, socket) context/(AuthContext) hooks/(useTicketSocket) styles/
server/src/  config/ models/ routes/ controllers/ middleware/ services/ sockets/ utils/ app.js server.js
server/scripts/seed.js
REQUIREMENTS_CHECKLIST.md  CODE_EXPLANATION.md  VIDEO_SCRIPT.md  render.yaml
```
Change from the suggested layout: added `services/ticketRules.js` (status rules) and `services/ticketAccess.js` (the single ownership check shared by HTTP and sockets), and `sockets/io.js` (lets controllers emit events).

## Prerequisites
Node.js 18+, npm, a MongoDB Atlas cluster (free tier is fine).

## MongoDB Atlas setup
1. Create a free cluster → *Database Access*: create a DB user (username + password).
2. *Network Access*: allow your IP for local work; for Render add `0.0.0.0/0` (Render IPs change) – note this trade-off in the video.
3. *Connect → Drivers*: copy the `mongodb+srv://...` string, put your DB name in the path (`/instaport`).

## Install and run locally
```bash
# Backend
cd server
cp .env.example .env        # then fill in real values (never commit .env)
npm install
npm run seed                # creates/updates the 2 demo accounts (safe to repeat)
npm run dev                 # http://localhost:5000  (health: /api/health)

# Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

## Environment variables
| Backend (`server/.env`, Render) | Purpose |
|---|---|
| `PORT` | Port (Render sets it itself) |
| `NODE_ENV` | `development` / `production` |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | Long random secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Token lifetime, default `1h` |
| `CLIENT_ORIGIN` | Exact frontend origin for CORS + Socket.IO (comma-separate several) |
| `SEED_CUSTOMER_EMAIL/PASSWORD`, `SEED_AGENT_EMAIL/PASSWORD` | Used only by `npm run seed` (the demo accounts) |
| `SEED_CUSTOMER2_EMAIL/PASSWORD` | Optional second customer, only to demonstrate ownership protection in the video (not shared) |

| Frontend (`client/.env`, Vercel) | Purpose |
|---|---|
| `VITE_API_BASE_URL` | e.g. `https://<backend>.onrender.com/api` |
| `VITE_SOCKET_URL` | e.g. `https://<backend>.onrender.com` |

Frontend variables are public (baked into the bundle) – never put secrets there. `.env` files are git-ignored; `.env.example` files hold placeholders only.

## Demo accounts and sharing credentials
Passwords are **not** in the repo. You choose them in the seed env vars, run `npm run seed` against the production database, and send the emails + passwords to the reviewer privately (e.g. direct message / password manager share). Re-running the seed updates the same two users (upsert by email) – no duplicates. Only two accounts are published to the reviewer. The optional second customer (`SEED_CUSTOMER2_*`) is for your own ownership demo.

## Validation limits (enforced on the server)
Subject 3–120 chars · Description 10–2000 · Reply 1–2000. Text is trimmed; blank/whitespace-only is rejected. IDs are validated before queries; status ∈ {Open, In Progress, Resolved}; priority ∈ {Low, Medium, High}.

## API
All routes are under `/api`. Protected routes need `Authorization: Bearer <token>`.

| Method & path | Who | Success | Notes |
|---|---|---|---|
| `GET /health` | public | 200 | health check |
| `POST /auth/login` | public (rate-limited) | 200 `{token,user}` | 400 missing fields, 401 wrong credentials, 429 too many failures |
| `POST /auth/logout` | logged in | 200 | stateless; client discards token + closes socket |
| `GET /auth/me` | logged in | 200 `{user}` | used to restore a session |
| `GET /tickets?status=` | logged in | 200 `{tickets}` | customer → own only; agent → all; `status` All/Open/In Progress/Resolved (400 otherwise) |
| `POST /tickets` | customer | 201 `{ticket}` | body `{subject, description}`; 400 invalid; 403 for agents |
| `GET /tickets/:id` | owner or agent | 200 `{ticket, messages}` | 404 if missing, invalid id **or not yours** |
| `POST /tickets/:id/messages` | owner or agent | 201 `{message}` | body `{body}`; 400 invalid; 404 not accessible |
| `PATCH /tickets/:id/status` | agent | 200 `{ticket}` | body `{status}`; 400 skip/reopen/invalid; 403 customer |
| `PATCH /tickets/:id/priority` | agent | 200 `{ticket}` | body `{priority}`; 400 invalid; 403 customer |

Errors always look like `{ "message": "..." }`. Unknown errors return 500 with a generic message; stack traces stay in server logs.

**Ownership-denial choice:** a customer asking for another customer's ticket gets **404**, same as a non-existent ticket, so the API does not reveal that the ticket exists. Customers calling agent-only endpoints get **403** (the endpoint's existence is not secret).

## Authentication and authorization design
- **Authentication** (`middleware/auth.js`): verifies JWT signature + expiry and reloads the user from MongoDB. Missing/invalid/expired → 401.
- **Authorization**: `requireRole("agent")` on status/priority routes; `findAccessibleTicket()` for ownership. The role and user id always come from the verified token/DB, never from the request body.
- **Token storage:** `sessionStorage` (survives refresh, cleared on tab close, works across Vercel/Render domains). Trade-off: JavaScript-readable, so an XSS bug could steal it; mitigated by React output escaping, no `dangerouslySetInnerHTML`, and a 1-hour lifetime. An HTTP-only cookie would be safer against XSS but requires `SameSite=None; Secure` + CORS credentials across two domains and CSRF considerations – left as a known limitation.
- **Token expiry:** default 1 hour. HTTP: expired → 401 → client clears state and shows "Your session expired" on the login page. Sockets: the server disconnects each socket at its token's expiry time and emits `auth:expired`; new connections with expired tokens are refused.
- **Revocation limit:** JWTs are stateless, so the server cannot instantly invalidate a still-valid token (e.g. stolen). Logout closes the client's own socket immediately; the 1-hour expiry (plus deleting a user, which breaks their tokens) bounds the exposure. A production system would add refresh tokens + a deny list.

## Socket.IO security and message flow
1. Handshake must carry a valid JWT (`auth.token`) → otherwise `connect_error`.
2. `ticket:join` re-checks "ticket exists and (you own it or you are an agent)" using the same function as HTTP. Knowing an ID is not enough; denied joins get `{ok:false}`.
3. Sockets have **no write events**. Replies are written only via the validated HTTP endpoint, then broadcast to the room **after** they are saved.
4. React leaves the room, removes listeners and closes the socket on page exit/logout.

## Reproducible checks (curl)
Quick proof of the security rules, using the seeded accounts. Start the server (`npm run dev`) and use Git Bash/macOS/Linux (on PowerShell use `curl.exe` and adjust quoting). Replace the emails/passwords with yours.
```bash
A=http://localhost:5000/api; J='Content-Type: application/json'
login(){ curl -s -X POST $A/auth/login -H "$J" -d "{\"email\":\"$1\",\"password\":\"$2\"}" | node -pe "JSON.parse(require('fs').readFileSync(0)).token"; }
C1=$(login customer@instaport.example '<pw>'); C2=$(login customer2@instaport.example '<pw>'); AG=$(login agent@instaport.example '<pw>')
TID=$(curl -s -X POST $A/tickets -H "$J" -H "Authorization: Bearer $C1" -d '{"subject":"Late parcel","description":"My parcel has not arrived yet"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).ticket._id")
code(){ curl -s -o /dev/null -w "%{http_code}
" "$@"; }

code -X POST $A/tickets -H "$J" -H "Authorization: Bearer $C1" -d '{"subject":"   ","description":"My parcel has not arrived yet"}'   # 400 blank subject
code $A/tickets/$TID -H "Authorization: Bearer $C2"                                                                                    # 404 other customer's ticket
code -X PATCH $A/tickets/$TID/status -H "$J" -H "Authorization: Bearer $C1" -d '{"status":"In Progress"}'                              # 403 customer cannot change status
code -X PATCH $A/tickets/$TID/status -H "$J" -H "Authorization: Bearer $AG" -d '{"status":"Resolved"}'                                 # 400 skipping a stage
code -X PATCH $A/tickets/$TID/status -H "$J" -H "Authorization: Bearer $AG" -d '{"status":"In Progress"}'                              # 200 allowed forward move
code -X POST $A/tickets/$TID/messages -H "$J" -H "Authorization: Bearer $C1" -d '{"body":"Any update?"}'                               # 201 reply saved
code $A/tickets                                                                                                                         # 401 no token
```
Expected codes are in the comments. Unauthorized **socket** access: in the browser console of a logged-in customer, a join for another customer's ticket returns `{ok:false}`; connecting without a token fails with "Authentication required" (see `sockets/index.js`). Login rate limit: 11 wrong passwords in a row return 429.

## Deployment
1. **Push to GitHub** (check `git status` shows no `.env`).
2. **Backend on Render:** New → Web Service (or use `render.yaml`) → root dir `server`, build `npm install`, start `npm start`, health check `/api/health`. Set env vars: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN` (temporary placeholder until step 3), `NODE_ENV=production`. Render provides HTTPS and supports WebSockets. (Free tier sleeps – first request may take ~30 s; wake it before recording.)
3. **Frontend on Vercel:** import repo, root dir `client`, framework Vite, build `npm run build`, output `dist`. Set `VITE_API_BASE_URL=https://<render-host>/api` and `VITE_SOCKET_URL=https://<render-host>`. `client/vercel.json` rewrites all routes to `index.html`, so refreshing `/tickets/:id` works.
4. Back on Render set `CLIENT_ORIGIN=https://<your-app>.vercel.app` (exact, no trailing slash) and redeploy.
5. **Seed production:** locally set `MONGODB_URI` to the Atlas URI plus the four `SEED_*` vars, run `npm run seed`.
6. **Verify live:** open `/api/health`; log in on the Vercel site; open DevTools → Network and confirm calls go to the Render URL and a `websocket` connection opens; send a reply from two browsers; refresh to confirm persistence.

Troubleshooting: *CORS error* → `CLIENT_ORIGIN` mismatch (scheme/host/trailing slash). *Socket won't connect* → wrong `VITE_SOCKET_URL` or backend asleep. *Blank page on refresh* → missing `vercel.json`. *Login 429* → wait 15 min or restart. *Changed `VITE_*` values* → redeploy the frontend (they are build-time).

## Known limitations
- Deployment, Atlas verification and the 30-minute video must be completed by you.
- Token revocation is time-based only (see above). Token in sessionStorage, not an HTTP-only cookie.
- Rate limiter is in-memory (per server instance, resets on restart).
- No pagination on ticket lists; one agent pool (no assignment); no registration/password reset/attachments (out of scope).
- The React UI has not been checked by automated browser tests; click through it manually.

## AI tool disclosure
This project was generated with Claude (Anthropic) from the assessment PDF: planning, code and documentation. **What was verified by running it:** the `curl` checks above, seed script idempotence, server start, CORS behaviour and a production frontend build. **What I (the author) must still verify and be able to explain:** the UI in a browser, Atlas connectivity, deployment, and every file (see `CODE_EXPLANATION.md`). *Edit this paragraph to describe what you personally checked.*
#   T i c k e t T r a c k e r S y s t e m  
 #   T i c k e t T r a c k e r S y s t e m  
 