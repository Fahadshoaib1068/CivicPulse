# Runbook

This runbook covers the operational procedures for the current branch of CivicPulse as implemented in this repository. It is intentionally limited to the Docker Compose deployment model and local service operations present in the checked-in source.

## Scope

- FastAPI backend at `http://localhost:8000`
- React/Vite frontend at `http://localhost:5173`
- PostgreSQL at the service name `postgres`
- Redis at the service name `redis`
- Deployment automation via GitHub Actions in `.github/workflows/cd.yml`

## Start and stop

### Start services

```bash
docker compose up -d --build
```

### Stop services

```bash
docker compose down
```

### Rebuild one service

```bash
docker compose up -d --build backend
```

## Health checks

### Backend

```bash
curl -fsS http://localhost:8000/ready
```

### Frontend

```bash
curl -fsS http://localhost:5173
```

### Container status

```bash
docker compose ps
```

### Logs

```bash
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f redis
```

## Configuration notes

The backend reads environment configuration from the runtime environment and defaults are defined in `backend/app/config.py`.

Key values:

- `DATABASE_URL`
- `REDIS_URL`
- `TRIAGE_PROVIDER`
- `GROQ_API_KEY`

The frontend resolves its API base URL in this order:

1. `window.CIVICPULSE_CONFIG.apiBaseUrl`
2. `VITE_API_BASE_URL`
3. The browser origin

This is implemented in `frontend/src/config.ts` and is reflected in `frontend/entrypoint.sh` for runtime config injection.

## Common issues

### Backend health check fails

1. Confirm containers are running with `docker compose ps`.
2. Inspect backend logs: `docker compose logs -f backend`.
3. Verify the database is healthy and reachable through `DATABASE_URL`.
4. Verify Redis is healthy and reachable through `REDIS_URL`.

### Frontend loads but API calls fail

1. Check whether the frontend has a runtime config override in `/config.js`.
2. Confirm the backend is up on port 8000.
3. Review `VITE_API_BASE_URL` and `window.CIVICPULSE_CONFIG.apiBaseUrl` values.

### Triage provider errors

1. Confirm `TRIAGE_PROVIDER` is one of the supported names in `backend/app/providers/triage/factory.py`.
2. Check backend logs for provider or fallback activation.
3. If using the LLM provider, confirm `GROQ_API_KEY` is present.

## Recovery

When the current deployment is unstable:

```bash
docker compose down --remove-orphans
docker compose up -d --build --remove-orphans
```

This rebuilds the stack without altering the repository structure.

## Deployment workflow

The current branch uses GitHub Actions from `.github/workflows/cd.yml` to validate the Compose configuration and then run the stack with Docker Compose. The flow is a direct application deployment pattern, not a Kubernetes rollout. No Kubernetes implementation is considered present in this branch's source of truth.
