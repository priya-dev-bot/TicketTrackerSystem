# Instaport Delivery – Support Ticket System

A full-stack MERN application that helps customers raise support tickets and communicate with support agents in real time using Socket.IO.

## Overview

The Instaport Support Ticket System provides a centralized platform for managing customer issues. Customers can create tickets and track their progress, while support agents can view tickets, respond to messages, update priorities, and manage ticket statuses.

**Project status:** Core backend checks and frontend production build are documented. Manual UI verification and deployment are still pending.

## Features

### Customer
- Secure login using JWT authentication
- Create and view personal support tickets
- Filter tickets by status
- View ticket details and conversation history
- Send replies and receive real-time updates

### Support Agent
- View and manage all customer tickets
- Reply to customer messages
- Set ticket priority: Low, Medium, or High
- Update status through Open → In Progress → Resolved

### Security and Reliability
- Password hashing with bcrypt
- Role-based access control
- Server-side ticket ownership validation
- Input validation and login rate limiting
- Consistent API error responses
- Socket.IO authentication and authorized ticket-room access
- MongoDB persistence for tickets and messages

## Tech Stack

| Area | Technologies |
|---|---|
| Frontend | React, Vite, React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose, MongoDB Atlas |
| Real-time communication | Socket.IO |
| Authentication | JWT, bcryptjs |
| Deployment targets | Vercel (frontend), Render (backend) |

## Application Architecture

```text
Customer / Support Agent
          |
          v
   React Frontend
          |
          | HTTPS API requests
          v
   Express.js Backend
          |
          v
      MongoDB Atlas

React Frontend <---- WebSocket ----> Express + Socket.IO
```

Messages are validated by the backend and saved to MongoDB before being broadcast to authorized users through Socket.IO.

## Project Structure

```text
TicketTrackerSystem/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   ├── package.json
│   └── vercel.json
├── server/
│   ├── scripts/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   └── utils/
│   └── package.json
├── CODE_EXPLANATION.md
├── REQUIREMENTS_CHECKLIST.md
├── VIDEO_SCRIPT.md
├── render.yaml
└── README.md
```

## Prerequisites

- Node.js and npm
- A MongoDB Atlas cluster or another supported MongoDB instance
- Git

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/priya-dev-bot/TicketTrackerSystem.git
cd TicketTrackerSystem
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file using `.env.example` as a reference and fill in your own values.

Required environment variables include:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=1h
CLIENT_ORIGIN=http://localhost:5173
```

Add the seed account email and password variables documented in `server/.env.example` before running the seed script.

Seed the demo accounts and start the backend:

```bash
npm run seed
npm run dev
```

The backend is expected to run at `http://localhost:5000`. Check `http://localhost:5000/api/health` for the health endpoint.

### 3. Configure the frontend

Open a second terminal:

```bash
cd client
npm install
```

Create `client/.env` using `client/.env.example` as a reference:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

**Important:** Never commit real `.env` files, database credentials, JWT secrets, or demo passwords to GitHub.

## API Overview

All API routes are under `/api`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Authenticate a user |
| POST | `/auth/logout` | Log out the current client session |
| GET | `/auth/me` | Retrieve the authenticated user |
| GET | `/tickets` | List accessible tickets |
| POST | `/tickets` | Create a customer ticket |
| GET | `/tickets/:id` | Retrieve an accessible ticket and messages |
| POST | `/tickets/:id/messages` | Add a reply |
| PATCH | `/tickets/:id/status` | Update ticket status (agent only) |
| PATCH | `/tickets/:id/priority` | Update ticket priority (agent only) |

Protected routes require a valid bearer token:

```text
Authorization: Bearer <token>
```

## Validation and Ticket Workflow

- Ticket subject: 3–120 characters
- Ticket description: 10–2,000 characters
- Reply: 1–2,000 characters
- Priorities: Low, Medium, High
- Status progression: Open → In Progress → Resolved

The backend enforces access permissions and prevents customers from accessing tickets owned by other customers.

## Testing and Verification

The project documentation describes backend API checks for authentication, ticket ownership, status transitions, message creation, and validation.

Before treating the project as fully verified, manually test the React UI, confirm the database connection, and validate the deployed application.

See `REQUIREMENTS_CHECKLIST.md` for assessment checks and `CODE_EXPLANATION.md` for implementation details.

## Deployment

Deployment is not yet confirmed.

The intended deployment setup is:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

Deployment requires configuring the appropriate environment variables, CORS origins, database access, and frontend API/socket URLs. Add the live URLs here after deployment and testing:

- Frontend: Not deployed yet
- Backend health endpoint: Not deployed yet

## Known Limitations

- Production deployment and manual browser verification are pending.
- JWT tokens are stored in `sessionStorage`.
- The login rate limiter uses in-memory storage.
- Ticket lists do not currently use pagination.
- Ticket assignment, registration, password reset, and attachments are outside the documented feature scope.

## AI Assistance Disclosure

AI tools assisted with project planning, implementation, and documentation. The project owner should review the code, verify application behavior, and be prepared to explain the implementation and testing results.

## Author
**Priyanka Jatoliya**

GitHub: [@priya-dev-bot](https://github.com/priya-dev-bot)
