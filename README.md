# CivicPulse

CivicPulse is a civic service complaint intake and triage platform. The repository contains a FastAPI backend for complaint submission and reporting, a Vite/React frontend for citizen-facing workflows, and local Docker Compose services for Postgres and Redis.

This branch, `fix/docker-database-initialization`, is the source of truth for the current implementation. It does not include Kubernetes manifests or a Kubernetes deployment workflow as part of the implemented system.

## What is in this repository

- Backend API in `backend/`
  - FastAPI application with complaint routes, health checks, stats, and metadata endpoints
  - Postgres-backed persistence via SQLAlchemy models and session configuration
  - Redis-backed cache and triage provider abstraction
- Frontend app in `frontend/`
  - Vite + React + TypeScript app for dashboard and complaint submission flows
  - runtime API config loaded from browser config or build-time environment variable
- Local infrastructure in `compose.yaml` and `compose.prod.yaml`
  - Postgres, Redis, backend, and frontend services
- Architecture decisions in `docs/adr/`

## Runtime architecture

- Frontend: served by nginx in Docker and loads an API URL through `/config.js` or a `VITE_API_BASE_URL` override.
- Backend: FastAPI service exposes complaint endpoints and triage logic.
- Storage: PostgreSQL stores complaint records; Redis caches triage results.
- Triage: the backend resolves a triage provider from `TRIAGE_PROVIDER` and falls back to the rule-based engine when needed.

## Local development

### Prerequisites

- Docker Desktop or Docker Engine
- Docker Compose v2
- Optional: Python 3.12 for local backend testing
- Optional: Node.js 20+ for frontend testing

### Environment variables

Copy the existing environment files as needed before running the stack:

- `backend/.env` or exported environment variables used by Docker Compose
- `frontend` uses `VITE_API_BASE_URL` at build or runtime, depending on the deployment model

The backend defaults are defined in `backend/app/config.py` and are intentionally simple:

- `DATABASE_URL`
- `REDIS_URL`
- `TRIAGE_PROVIDER`
- `GROQ_API_KEY`

### Start the stack

```bash
docker compose up -d --build
```

### Check health

```bash
curl -fsS http://localhost:8000/ready
curl -fsS http://localhost:5173
```

The backend service should be reachable on port 8000 and the frontend on port 5173.

## Repository conventions

- ADRs live in `docs/adr/`.
- Operational guidance lives at the repo root in `RUNBOOK.md` and `ENGINEERING-NOTES.md`.
- The current branch is the source of truth; do not assume Kubernetes configuration has been merged into this branch unless it is actually present in the repository.

## Useful commands

```bash
# backend tests
cd backend
pytest

# frontend tests
cd frontend
npm test -- --run

# inspect the compose stack
docker compose ps
docker compose logs -f backend
```

## Current deployment posture

This branch uses GitHub Actions to validate and then rebuild the Docker Compose stack on push to `main` via `.github/workflows/cd.yml`. It is not a GitOps or Kubernetes-based deployment model in the checked-in source tree.
