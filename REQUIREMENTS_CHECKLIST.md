# Instaport Delivery – Requirements Checklist

Source of truth: *Instaport_Delivery_MERN_Assessment.pdf* (6 pages).
Status values: PASS (implemented and verified) | PARTIAL | BLOCKED (needs external account/action) | FAIL (not implemented / failed).
**Updated after build.** PASS = verified by running code. PARTIAL = implemented but not fully verified (mostly the React UI, which compiles but has not been run in a browser). BLOCKED = needs your accounts/actions. Backend behaviour was checked during the build (curl and a throwaway test run) against a local Mongo-compatible server, **not Atlas**. The test suite is not part of the deliverable, so only the README curl checks can be re-run by you.

## Authentication and roles (PDF p.2)
| ID | Requirement | Planned file(s) | Verification | Status |
|---|---|---|---|---|
| AUTH-01 | JWT login with 2 pre-created demo accounts (1 customer, 1 agent) | server/src/controllers/authController.js, scripts/seed.js | curl login | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| AUTH-02 | No registration | (no route exists) | review routes | PASS — no register route exists |
| AUTH-03 | Seed script is repeatable, no duplicates (upsert) | server/scripts/seed.js | run twice, count users | PASS — seed run twice -> 2 users |
| AUTH-04 | Store bcrypt password hashes only | models/User.js, seed.js | inspect DB doc | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| AUTH-05 | Customers list/open/reply only to own tickets (server enforced) | services/ticketAccess.js, ticketController.js | curl: other customer 404 | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| AUTH-06 | Agents view/manage all tickets | ticketController.js, middleware/requireRole.js | curl: agent requests | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| AUTH-07 | Protected frontend routes + logout | client/src/components/ProtectedRoute.jsx, context/AuthContext.jsx | manual | PARTIAL — built + compiled; browser check pending |
| AUTH-08 | Reject invalid/expired tokens, clear login state | middleware/auth.js, client interceptor | curl: no/invalid token | PARTIAL — backend 401s checked; client logout on 401 not browser-checked |
| AUTH-09 | JWT secret from env | config/env.js | review | PASS — env.js; server refuses to start without secret |
| AUTH-10 | Basic login rate limiting (429) | middleware/loginLimiter.js | curl: repeated wrong logins | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| AUTH-11 | Documented token-expiry strategy | README, CODE_EXPLANATION | doc review | PASS — documented in README |
| AUTH-12 | Deliberate token storage (HTTP-only cookie vs localStorage trade-off documented) | authController.js, README | doc + manual | PASS — sessionStorage trade-off documented |
| AUTH-13 | Never expose hashes, secrets, tokens, stack traces | middleware/errorHandler.js | response inspection curl / review | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |

## Customer dashboard (p.2)
| ID | Requirement | Planned file(s) | Verification | Status |
|---|---|---|---|---|
| CUST-01 | Create ticket (subject + description required); starts Open / Medium | ticketController.js, pages/CreateTicket.jsx | manual | PARTIAL — API checked during build; form UI not browser-checked |
| CUST-02 | List own tickets: subject, status, priority, last updated | pages/CustomerDashboard.jsx | manual | PARTIAL — API checked during build; UI pending |
| CUST-03 | Filter All / Open / In Progress / Resolved | components/StatusFilter.jsx | manual | PARTIAL — API filter checked via validation; UI pending |
| CUST-04 | Ticket detail: description + chronological conversation | pages/TicketDetail.jsx | manual | PARTIAL — API checked during build (order); UI pending |
| CUST-05 | Non-empty reply with submission feedback | TicketDetail.jsx, messageController.js | manual | PARTIAL — API checked during build; UI pending |
| CUST-06 | Customer cannot change status/priority | routes + requireRole(agent) | curl / review | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| CUST-07 | Both roles may reply on Resolved without reopening | messageController.js | curl / review | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |

## Agent dashboard (p.2)
| ID | Requirement | Planned file(s) | Verification | Status |
|---|---|---|---|---|
| AGENT-01 | View all tickets, show customer, filter by status | pages/AgentDashboard.jsx | manual + curl / review | PARTIAL — API checked during build; UI pending |
| AGENT-02 | Status forward only: Open→In Progress→Resolved; no skip/reopen | services/ticketRules.js | code review | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| AGENT-03 | Set priority Low/Medium/High, persisted | ticketController.js | curl / review | PARTIAL — API persisted (checked during build); UI select pending |
| AGENT-04 | View full conversation and reply | TicketDetail.jsx | manual | PARTIAL — API checked during build; UI pending |

## Real-time (p.2)
| ID | Requirement | Planned file(s) | Verification | Status |
|---|---|---|---|---|
| RT-01 | Socket.IO delivers replies to authorized viewers without refresh | sockets/index.js, hooks/useTicketSocket.js | code review of sockets/index.js + manual | PARTIAL — checks during build delivery PASS; browser pending |
| RT-02 | Save to MongoDB before success/broadcast | messageController.js | curl / review | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| RT-03 | History persists after refresh | Message model | manual | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| RT-04 | Show sender name, role, timestamp | TicketDetail.jsx / MessageList.jsx | manual | PARTIAL — API returns sender/role/time; UI pending |
| RT-05 | No duplicate messages (dedupe by Mongo `_id`) | hooks/useTicketSocket.js | unit/manual | PARTIAL — same _id verified in socket test; mergeMessages not browser-checked |

## Backend, database, security (p.3)
| ID | Requirement | Planned file(s) | Verification | Status |
|---|---|---|---|---|
| BE-01 | Node + Express, Mongoose | server/src | review | PASS — code review |
| BE-02 | Real hosted MongoDB (Atlas), not in-memory/local | config/db.js | live check | BLOCKED — tests ran on local Mongo-compatible DB; Atlas not reachable from here |
| BE-03 | Modular auth/ticket/validation/error code | folder layout | review | PASS — folder layout |
| BE-04 | Validate IDs, bodies, status/priority enums, string lengths; trim; reject blanks | utils/validators.js | curl: invalid input | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| BE-05 | Document length limits (subject 3–120, description 10–2000, reply 1–2000) | README | doc review | PASS — README |
| BE-06 | Customer/sender identity from JWT, never from body | controllers | curl / review | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| BE-07 | Consistent JSON errors + correct status codes (200/201/400/401/403/404/429/500) | errorHandler.js | curl / reviews | PARTIAL — 200/201/400/401/403/404/429 checked; 500 path by code review only |
| BE-08 | Data models User/Ticket/Message with refs, timestamps, indexes | models/ | review | PASS — models |
| BE-09 | Document ownership-denial behavior (404 vs 403) | README | doc review | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |

## Socket security (p.3)
| ID | Requirement | Planned file(s) | Verification | Status |
|---|---|---|---|---|
| SOCK-01 | Authenticate handshake with JWT; reject missing/invalid/expired | sockets/index.js | code review of sockets/index.js | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| SOCK-02 | Verify ticket exists and user is owner/agent before room join | sockets/index.js | code review of sockets/index.js | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| SOCK-03 | Knowing a ticket ID grants nothing | same | code review of ticket:join | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| SOCK-04 | Writes via HTTP protected equivalently (replies go through HTTP only) | routes/index.js | curl / review | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| SOCK-05 | Broadcast only to the authorized ticket room | messageController.js | code review of emitToTicket | PASS — checked during build (curl and/or a throwaway test run that is no longer in the repo) |
| SOCK-06 | Remove socket access on logout/expiry; explain revocation limits | sockets, client AuthContext | curl / review + doc | PARTIAL — logout disconnect + expiry timer implemented; not checked |
| SOCK-07 | Restricted CORS/origin for HTTP and Socket.IO via `CLIENT_ORIGIN` | app.js, sockets/index.js | manual/curl / review | PARTIAL — HTTP CORS verified by hand; socket CORS config not checked |
| SOCK-08 | Client listener/socket cleanup on ticket exit and logout | useTicketSocket.js | manual | PARTIAL — cleanup coded; browser pending |

## UI/UX (p.4)
| ID | Requirement | Planned file(s) | Verification | Status |
|---|---|---|---|---|
| UI-01 | React frontend, tidy layout, role-specific navigation, green branding | client/src | manual | PARTIAL — built; not viewed in browser |
| UI-02 | Status and priority badges with text labels | components/Badge.jsx | manual | PARTIAL — built; pending |
| UI-03 | Create ticket and reply are easy to find | pages | manual | PARTIAL — built; pending |
| UI-04 | Loading, empty, success, error states | all pages | manual | PARTIAL — built; pending |
| UI-05 | Disable submit while pending; preserve text on failure | forms | manual | PARTIAL — built; pending |
| UI-06 | Visible labels and keyboard focus | styles/main.css | manual | PARTIAL — CSS focus styles; pending |
| UI-07 | Responsive on mobile and desktop | styles/main.css | browser resize | PARTIAL — responsive CSS; pending |

## Deployment (p.4)
| ID | Requirement | Planned file(s) | Verification | Status |
|---|---|---|---|---|
| DEPLOY-01 | Frontend deployed (Vercel) | client/vercel.json | live URL | BLOCKED — needs your Vercel account |
| DEPLOY-02 | Backend deployed on persistent-Node host with Socket.IO (Render) | render.yaml | live URL | BLOCKED — needs your Render account |
| DEPLOY-03 | Frontend uses hosted API + socket URL, never localhost | VITE_API_BASE_URL, VITE_SOCKET_URL | inspect live network calls | PARTIAL — prod build verified: uses env URL, app code has no localhost fallback; live check blocked |
| DEPLOY-04 | Hosted MongoDB connected, env vars set on host, HTTPS | host dashboard | live check | BLOCKED — needs Atlas + host env vars |
| DEPLOY-05 | Live login, API, socket, persistence verified | n/a | manual on live app | BLOCKED — needs live deployment |
| DEPLOY-06 | Refresh on client-side routes works (SPA rewrite) | vercel.json | refresh `/tickets/:id` | PARTIAL — vercel.json rewrite written; live check pending |
| DEPLOY-07 | .env, URIs, secrets out of Git and recording; placeholder .env.example | .gitignore, .env.example | `git ls-files` check | PARTIAL — .gitignore + .env.example done; verify with git status in your repo |

## Submission (pp.1, 5, 6)
| ID | Requirement | Planned file(s) | Verification | Status |
|---|---|---|---|---|
| SUB-01 | GitHub repo with full source (reviewer access if private) | n/a | repo link | BLOCKED — your GitHub repo |
| SUB-02 | Live frontend URL + backend base URL | README | verified links | BLOCKED — after deployment |
| SUB-03 | Demo credentials shared privately, not committed | README instructions | review | PASS — README process; no passwords in repo |
| SUB-04 | README: prerequisites, run commands, env names, seed, deploy, architecture, AI usage, limitations | README.md | doc review | PARTIAL — README done; live URLs + your AI-usage edit pending |
| SUB-05 | Reproducible checks: ownership, agent-only actions, validation, reply persistence, unauthorized socket access | README "Reproducible checks" | run the curl commands | PARTIAL — 10 checks during build run OK (ownership 404, agent-only 403, validation 400, persistence, 429, 401); socket denial documented, not scripted |
| SUB-06 | AI-tool disclosure in README and video | README, VIDEO_SCRIPT | doc review | PARTIAL — disclosure drafted; edit with your own verification |

## Video (p.5)
| ID | Requirement | Planned file(s) | Verification | Status |
|---|---|---|---|---|
| VIDEO-01 | ≥30 min narrated screen recording, timestamps per section | VIDEO_SCRIPT.md | you record it | BLOCKED — you must record |
| VIDEO-02 | Real setup footage (folder creation, install) | VIDEO_SCRIPT.md Part 1 | recording | BLOCKED — you must record |
| VIDEO-03 | Code walkthrough (backend 9 min, frontend 6 min) | VIDEO_SCRIPT.md Parts 2–3 | recording | BLOCKED — you must record |
| VIDEO-04 | Demo: invalid login/input, ticket flow, two-way realtime, status/priority, filters, refresh | VIDEO_SCRIPT.md Part 4 | recording | BLOCKED — you must record |
| VIDEO-05 | Show customer denied agent-only change; ownership via 2nd customer or backend test | Part 4 | recording | BLOCKED — you must record |
| VIDEO-06 | Show/explain unauthorized socket join denial | Part 4 | recording | BLOCKED — you must record |
| VIDEO-07 | Deployed frontend talking to hosted backend; secrets hidden | Part 5 | recording | BLOCKED — you must record |
