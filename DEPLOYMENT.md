# Deployment Readiness

Smart Pharma Intelligence is prepared for the safest first online deployment path:

- Frontend on Vercel
- Backend FastAPI service on Render, Railway, Fly.io, or another Python web host
- SQLite remains supported for local and demo mode
- Postgres migration is intentionally left for a later production hardening step

This document does not deploy anything. It records the settings needed to keep local development working while making the app configurable for a public demo.

## Local Development

### Backend

```powershell
cd backend
.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```text
http://127.0.0.1:8000/health
```

API docs:

```text
http://127.0.0.1:8000/docs
```

### Frontend

```powershell
cd frontend
npm run dev
```

Open:

```text
http://localhost:3000/dashboard
```

For local frontend calls, keep:

```text
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Backend Deployment

Use a Python web host such as Render, Railway, or Fly.io.

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set these backend environment variables:

```text
DATABASE_URL=sqlite:///./pharma_intel.db
FRONTEND_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,https://your-vercel-app.vercel.app
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Replace `https://your-vercel-app.vercel.app` with the real Vercel frontend URL after deployment.

`OPENAI_API_KEY` is optional for the MVP. If it is empty, the backend uses deterministic fallback analysis.

## Frontend Deployment on Vercel

Create the Vercel project from this repository and set:

```text
Root Directory: frontend
```

Set this frontend environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain
```

Replace `https://your-backend-domain` with the deployed backend URL from Render, Railway, Fly.io, or your chosen host.

`NEXT_PUBLIC_API_URL` is supported as a compatibility fallback, but `NEXT_PUBLIC_API_BASE_URL` is the preferred variable.

## Production CORS

The backend reads `FRONTEND_ORIGIN` as a comma-separated list.

Example:

```text
FRONTEND_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,https://smart-pharma-demo.vercel.app
```

Keep local origins in the list if you want the same backend to support both local development and the deployed frontend.

## Deployment Verification

After deploying the backend, verify:

```text
https://your-backend-domain/health
https://your-backend-domain/docs
https://your-backend-domain/pharmacy-risks
```

After deploying the frontend, verify:

```text
https://your-vercel-app.vercel.app/dashboard
https://your-vercel-app.vercel.app/pharmacy-risk
https://your-vercel-app.vercel.app/reports/new
https://your-vercel-app.vercel.app/signals
https://your-vercel-app.vercel.app/actions
```

## SQLite Demo-Mode Limitations

SQLite is kept for local and demo simplicity. On many hosted platforms, local disk can be ephemeral, reset between deployments, or unavailable across multiple instances.

This means:

- demo seed data is suitable for presentations
- uploaded reports may not persist reliably after redeploys or instance restarts
- concurrent multi-user production use is not the goal of this mode
- a managed Postgres database should be used before production rollout

The current architecture remains intentionally simple until that migration is needed.
