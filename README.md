# Smart Pharma Intelligence MVP

Smart Pharma Intelligence is a local-first AI-powered pharmaceutical field intelligence platform. It transforms delegate field reports into operational signals, alerts, dashboard analytics, and next best actions.

This MVP is intentionally not a CRM, ERP, or sales pipeline tool.

## Stack

- Backend: FastAPI, SQLAlchemy, SQLite, OpenAI Python SDK
- Frontend: Next.js App Router, TypeScript, Tailwind CSS, Recharts
- Local only: single-user, no auth, no Redis, no Celery, no microservices

## Project Structure

```text
smart-pharma-mvp/
├── backend/
├── frontend/
├── README.md
└── .gitignore
```

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

The API runs at:

```text
http://localhost:8000
```

Health check:

```text
GET http://localhost:8000/health
```

If `OPENAI_API_KEY` is empty, the backend uses deterministic fallback analysis and still generates signals and next best actions.

## Frontend Setup

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

The app runs at:

```text
http://localhost:3000
```

## Core Workflow

```text
Delegate Field Report
→ AI Analysis
→ Operational Signal
→ Dashboard Analytics
→ Next Best Action
```

## Required API Routes

```text
GET  /health
POST /reports
GET  /reports
POST /reports/{report_id}/analyze
GET  /signals
GET  /dashboard/summary
GET  /dashboard/trends
GET  /dashboard/categories
GET  /dashboard/severity
GET  /actions
```

## Local Test Flow

1. Start the backend with `uvicorn app.main:app --reload`.
2. Start the frontend with `npm run dev`.
3. Open `http://localhost:3000/dashboard`.
4. Confirm demo reports, operational signals, charts, and actions are visible.
5. Open `http://localhost:3000/reports/new`.
6. Submit a field report mentioning a stock shortage, competitor activity, safety issue, pricing pressure, or opportunity.
7. Confirm the generated signal appears on `/signals`.
8. Confirm the generated next best action appears on `/actions`.
9. Confirm dashboard metrics update.

## Deployment Notes

For the safest public demo path, deploy the frontend on Vercel and the FastAPI backend on a Python web host such as Render, Railway, or Fly.io.

See [DEPLOYMENT.md](DEPLOYMENT.md) for required environment variables, build commands, start commands, CORS configuration, and SQLite demo-mode limitations.
