# College Coding Assessment Platform

A full-stack online coding assessment system for colleges, replacing the PDF + Google Forms workflow with a real-time coding environment.

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS + Monaco Editor
- **Backend:** Node.js + Express.js
- **Database:** MongoDB (Mongoose)
- **Code Execution:** Judge0 (sandboxed)
- **Auth:** JWT (httpOnly cookies) + Email verification

## Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Manage authorized emails (CSV bulk import), manage users |
| **Teacher** | Create/edit/publish questions, monitor submissions, review student code |
| **Student** | Browse published questions, write & submit code, view results |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Judge0 (local Docker or RapidAPI key)

### 1. Server Setup
```bash
cd server
cp .env.example .env
# Fill in your .env values (MongoDB, SMTP, Judge0)
npm install
node seed-admin.js   # Create the first admin account (run once)
npm run dev
```

### 2. Client Setup
```bash
cd client
npm install
npm run dev
```

Server runs on `http://localhost:5000`  
Client runs on `http://localhost:5173`

## Project Structure

```
college-coding-plateform/
├── client/          # React frontend (Vite + Tailwind)
└── server/          # Express API server
```

See the full [implementation plan](../plan.md) for phase-by-phase details.

## Development Phases

1. ✅ **Phase 1** — Project setup & database models
2. 🔄 **Phase 2** — Authentication & allowlist
3. ⏳ **Phase 3** — Admin dashboard
4. ⏳ **Phase 4** — Question management
5. ⏳ **Phase 5** — Coding workspace & execution
6. ⏳ **Phase 6** — Teacher monitoring & review
7. ⏳ **Phase 7** — Testing & deployment
