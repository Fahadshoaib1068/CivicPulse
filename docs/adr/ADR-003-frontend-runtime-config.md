# ADR-003: Frontend Runtime API Configuration

- Status: Accepted
- Date: 2026-09-27

## Context

The frontend needs to call the backend API, but the API base URL may differ between local development, Docker Compose, and production environments. A build-time-only value is too rigid for a containerized deployment and prevents a single static bundle from being reused across environments.

The repository currently serves the frontend from nginx and exposes a runtime config file loaded before the application bootstraps.

## Decision

We will resolve the API base URL at runtime using a precedence order defined in `frontend/src/config.ts`:

1. `window.CIVICPULSE_CONFIG.apiBaseUrl`
2. `VITE_API_BASE_URL`
3. the browser origin as the final fallback

This runtime config is written by `frontend/entrypoint.sh` into `/config.js` if the environment variable is present. The HTML entrypoint loads `/config.js` before the frontend app renders.

This keeps the application portable while still supporting a conventional local development flow using environment variables.

## Consequences

### Positive

- A single frontend bundle can be reused across environments.
- Container deployments can override the API endpoint without rebuilding the frontend.
- Local development remains straightforward when `VITE_API_BASE_URL` is set.

### Negative

- Runtime config depends on the page loading the correct script and on the environment providing the correct values.
- Misconfigured runtime values can lead to requests being sent to the wrong backend origin.
- The configuration logic is split across frontend TypeScript and the nginx entrypoint, which requires operational awareness during deployment changes.

## Follow-up

This ADR should be reviewed if the project introduces a different front-end deployment model, a different static host, or a stronger environment contract than the current runtime override pattern.
