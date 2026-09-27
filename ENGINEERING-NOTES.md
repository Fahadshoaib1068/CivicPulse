# Engineering Notes

These notes capture the engineering posture of the current branch of CivicPulse and should be treated as the live source-of-truth documentation for this repository state.

## Current system model

The repository contains:

- A Python/FastAPI backend in `backend/`
- A TypeScript/Vite frontend in `frontend/`
- PostgreSQL and Redis services managed by Docker Compose
- GitHub Actions deployment automation in `.github/workflows/cd.yml`

This branch does not include any Kubernetes manifests or Kubernetes deployment logic as implemented code. Any future Kubernetes work must be merged before it is treated as part of the repository's executed deployment model.

## Backend architecture

The backend is organized around a few core responsibilities:

- request handling and routing
- complaint persistence and retrieval
- analytics/statistics generation
- triage provider selection and fallback logic
- caching for repeated triage requests

The API entrypoint is `backend/app/main.py`, and settings are loaded from `backend/app/config.py`.

## Triage provider abstraction

The provider abstraction is intentionally narrow to keep the service swappable without changing the rest of the app.

The contract is defined in `backend/app/providers/triage/base.py`:

- `TriageProvider` is a protocol
- each provider exposes a `name` string
- `triage(text: str, location: str) -> TriageResult` is the required method

The runtime provider is selected by `backend/app/providers/triage/factory.py` from the `TRIAGE_PROVIDER` environment variable. Supported values in this branch include:

- `rules`
- `simulated`
- `llm`
- `ollama`

The service layer in `backend/app/services/triage_service.py` wraps the selected provider and applies a fallback rule engine when the current provider fails.

## Frontend configuration model

The frontend is designed to resolve its API base URL at runtime instead of hard-coding a single environment.

The runtime logic in `frontend/src/config.ts` resolves this order:

1. `window.CIVICPULSE_CONFIG.apiBaseUrl`
2. `VITE_API_BASE_URL`
3. the browser origin as a default

The static runtime config is written by `frontend/entrypoint.sh` into `/config.js`, which is loaded by `frontend/index.html` before the application bootstraps.

This pattern allows the same frontend bundle to be reused across local, staging, and production environments without rebuilding code for each deployment target.

## Deployment model

The repository's checked-in deployment path is not Kubernetes-based. Instead, the deployment workflow in `.github/workflows/cd.yml` performs the following:

- checks out the repository
- validates the Docker Compose configuration
- runs `docker compose -f compose.yaml -f compose.prod.yaml up -d --build --remove-orphans`
- waits for service health checks
- performs smoke tests on the backend and frontend

This means the current branch's operational model is a direct Docker Compose deployment that is triggered from GitHub Actions on `main`.

## Design constraints and guardrails

- Configuration should remain explicit and inspectable via environment variables.
- Triage provider logic should remain interchangeable through the protocol-based interface.
- The frontend build should be environment-agnostic and allow runtime overrides.
- Any future deployment strategy that introduces immutable artifacts or SHA-based release promotion should be captured in a dedicated ADR.

## Notes for future work

If the project evolves to a production deployment strategy with image pinning or release-by-commit, the decision should be recorded in a new ADR rather than assumed from the current branch state.
