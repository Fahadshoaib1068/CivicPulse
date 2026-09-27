# ADR-004: Deploy-by-SHA

- Status: Accepted
- Date: 2026-09-27

## Context

A deployment strategy based on a commit SHA can make runtime behavior easier to trace, verify, and roll back because the deployed artifact is tied to an immutable revision. In many production systems, deploy-by-SHA is used alongside artifact promotion, environment pinning, or release orchestration.

The current branch does not yet implement that model. The checked-in deployment flow instead relies on GitHub Actions plus Docker Compose to build and bring up the stack from the repository checkout on the target branch.

## Decision

We will not document Kubernetes as implemented in this branch, and we will not assume a SHA-based deployment model is present in the source of truth. On this branch, deployment is a direct Compose-based workflow defined in `.github/workflows/cd.yml`:

- validate the Compose configuration
- rebuild the stack with `docker compose ... up -d --build --remove-orphans`
- wait for health checks
- smoke test the backend and frontend

This means the current branch's operational model is versioned through the repository state and CI workflow, not through an immutable image tag or deploy-by-commit pipeline that is recorded here as implemented.

## Consequences

### Positive

- The deployment process remains simple and easy to reason about in this repository state.
- The branch remains faithful to the code and configuration actually checked in.
- There is no false assumption that Kubernetes or a SHA-driven rollout already exists.

### Negative

- The deployment is less traceable than a commit-pinned, artifact-based workflow.
- Rollback and verification are more manual than a formal deploy-by-SHA process.
- A future production rollout will need a deliberate ADR update once the SHA-based model is implemented.

## Follow-up

This ADR should be reassessed when the repository adopts a deploy-by-SHA workflow, such as immutable image tags, artifact promotion, or external release orchestration.
