# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Luz Coletiva is a Brazilian mutual-aid platform (pt-BR UI) connecting people who need help with those who can provide it. The stack is FastAPI + PostgreSQL + Redis/Celery on the backend, and React + Vite + TailwindCSS on the frontend, orchestrated via Docker Compose.

## Running the Project

**Full stack (Docker — recommended):**
```bash
cp .env.example .env   # then fill JWT_SECRET and POSTGRES_PASSWORD
docker compose up -d --build
# Frontend: http://localhost  |  API docs: http://localhost:8000/docs
```

**Local development (backend only, needs DB + Redis running):**
```bash
docker compose up -d db redis
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL="postgresql+psycopg2://luzcoletiva:luzcoletiva@localhost:5432/luzcoletiva" \
  JWT_SECRET="dev-secret" \
  REDIS_URL="redis://localhost:6379/0" \
  uvicorn app.main:app --reload
```

**Frontend dev server:**
```bash
cd frontend && npm install && npm run dev   # http://localhost:5173
```

**Frontend build/lint:**
```bash
cd frontend && npm run build
cd frontend && npm run lint
```

There is no test suite yet (MVP phase).

## Architecture

### Backend (`backend/app/`)

- `main.py` — FastAPI app wiring: routers, CORS, rate limiter, startup handler that calls `create_tables()`
- `core/` — cross-cutting concerns: `config.py` (env-based settings via Pydantic BaseSettings), `database.py` (SQLAlchemy engine + `SessionLocal`), `security.py` (bcrypt + JWT), `deps.py` (DI helpers: `get_db`, `get_current_user`), `rbac.py` (`require_role`, `require_admin` decorators), `limiter.py` (slowapi instance), `migrations.py` (`create_tables()` — SQLAlchemy `create_all`, no Alembic yet)
- `models/` — SQLAlchemy ORM: `user.py` (User), `help.py` (HelpRequest, HelpOffer, ChatMessage, ChatReport), `audit.py` (AdminAuditLog — append-only)
- `schemas/` — Pydantic v2 request/response models
- `routes/` — FastAPI routers mounted at `/api`: `auth.py`, `profile.py`, `stories.py`, `help.py`, `admin.py`
- `tasks/` — Celery app (`celery_app.py`) + async email tasks (`email_tasks.py`); broker is Redis; timezone is `America/Sao_Paulo`

### Frontend (`frontend/src/`)

- `App.jsx` — React Router v6 route tree
- `context/AuthContext.jsx` — JWT auth state; token persisted as `localStorage.luz_token`
- `services/api.js` — Axios instance; attaches `Authorization: Bearer` header; auto-logs out on 401
- `pages/` — full-page route components
- `components/` — shared UI; `ProtectedRoute` enforces auth
- Brand colors: `#FFD54F` (yellow), `#4FC3F7` (blue), `#81C784` (green)

### Data flow

Browser → Nginx (port 80) → React SPA → Axios → FastAPI (`/api/*`) → PostgreSQL  
Background work: FastAPI route → Celery task → Redis broker → Celery worker → SMTP

## Key Conventions

**Auth:** JWT payload carries `sub` (user ID) and `type` (profile_type). Token TTL is `JWT_EXPIRES_MIN` (default 60 min). Three roles: `user`, `moderator`, `admin`.

**RBAC:** Use `require_role` / `require_admin` from `core/rbac.py` as route dependencies — not inline checks.

**Database:** Tables are created via `create_all()` on startup. No Alembic migrations yet — adding a column requires a manual `ALTER TABLE` or a full `drop + recreate` in dev. Plan Alembic migration before any production schema change.

**Rate limiting:** Register is 3/hour, login is 5/5 min (configured in `routes/auth.py` via slowapi). Keep rate limits on any new public auth endpoint.

**Error messages:** Login returns a generic "Credenciais inválidas" — never expose whether the email or password was wrong (anti-enumeration).

**Email tasks:** Fire-and-forget. The route should not fail if Celery/broker is unavailable; tasks are always dispatched with `.delay()` and errors are swallowed.

**Language:** UI strings and user-facing messages are in Portuguese (pt-BR). Internal code, variable names in core/infrastructure code, and API field names are in English.
