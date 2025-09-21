# Task Manager Frontend (Next.js 15 + TypeScript)

This is the frontend for the Task Management System with AI Assistants.

Tech stack:

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn-inspired styles
- React Hook Form + Zod validation
- Zustand for auth state
- Axios for API calls
- WebSocket for real-time task updates

## Getting Started

Prerequisites:

- Node.js 20+

Install and run:

```bash
cd frontend
npm install
npm run dev
```

Environment variables (create `.env.local`):

```
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_WS_BASE=ws://localhost:8000
```

Open http://localhost:3000

## Docker

Build and run with Docker Compose from the repository root:

```bash
docker compose up --build
```

This will start:

- PostgreSQL at localhost:5432
- FastAPI backend at http://localhost:8000
- Next.js frontend at http://localhost:3000

## Features

- Authentication with email/password
- Task Dashboard with list, creation form, and validation
- Task Detail page with edit, complete/incomplete toggle, delete with confirmation
- AI Assistant panel to trigger analyze and assist agents
- Real-time updates via WebSocket `/ws/tasks?token=...`
- Responsive design using Tailwind CSS

## Notes

- Tokens are kept in memory (Zustand) for simplicity; refresh token is used to auto-refresh access token. In production,
  consider secure httpOnly cookies.
- CORS is configured server-side to allow localhost in development.
