# CivicPulse Engineering Notes

## 1. Project Overview

CivicPulse is a civic complaint intake and AI-assisted triage platform.

The system consists of:

```text
React + TypeScript frontend
            |
            v
       FastAPI backend
            |
      +-----+-----+
      |           |
      v           v
 PostgreSQL     Redis
      |
      v
Complaint / triage data
```

The backend also communicates with replaceable triage providers.

## 2. Triage Architecture

The triage system is based on a provider abstraction.

The core provider contract is defined through the `TriageProvider` interface/protocol.

Current provider implementations include:

* Rule-based triage
* Simulated triage
* LLM-based triage

The service layer does not need to depend directly on a specific provider implementation.

This allows providers to be replaced without changing the complaint API.

## 3. Fallback and Reliability

The triage service supports retry and fallback behavior.

If the preferred provider cannot successfully complete a request, the service can fall back to another available provider.

This prevents the complaint submission path from depending entirely on one AI provider.

## 4. Triage Caching

Redis is used to cache triage results.

Caching reduces repeated processing for equivalent complaint content and reduces unnecessary calls to external AI providers.

The cache layer is integrated with the triage service rather than being exposed directly to the frontend.

## 5. Complaint Processing

The complaint flow is approximately:

```text
Citizen
   |
   v
Frontend
   |
   v
Complaint API
   |
   v
Complaint Service
   |
   v
Triage Service
   |
   +-------------------+
   |                   |
   v                   v
Redis Cache       Triage Provider
                       |
               +-------+-------+
               |       |       |
               v       v       v
             Rules  Simulated  LLM
   |
   v
PostgreSQL
```

## 6. Database

PostgreSQL is the primary persistent database.

SQLAlchemy is used for database interaction and Alembic manages schema migrations.

Database schema changes should be introduced through Alembic migrations rather than manual production database changes.

## 7. Redis

Redis provides application-level infrastructure for:

* Triage caching
* Cache-backed functionality
* Distributed rate limiting

Redis is deployed as a separate service in Docker Compose and Kubernetes.

## 8. Rate Limiting

Complaint-related endpoints use distributed rate limiting backed by Redis.

This allows rate-limit state to be shared across multiple backend instances rather than being stored only in the memory of a single process.

## 9. Observability

The backend includes structured logging and request-level observability.

Important information includes:

* Timestamp
* Log level
* Logger
* Request ID
* HTTP method
* Request path
* Status code
* Request latency

The application also provides:

```text
/health
/ready
/metrics
```

Graceful shutdown is implemented through the application lifespan mechanism.

## 10. Frontend Runtime Configuration

The frontend does not hard-code a single backend deployment location into the application logic.

Runtime/API configuration is documented through:

```text
docs/adr/ADR-003-frontend-runtime-config.md
```

This allows the same frontend codebase to be used in different environments.

## 11. Docker Architecture

The Docker Compose architecture contains:

```text
                 Edge Network
                     |
          +----------+----------+
          |                     |
      Frontend               Backend
                                |
                         Internal Network
                           /          \
                          /            \
                    PostgreSQL        Redis
```

The Compose configuration separates the edge-facing services from internal infrastructure services.

PostgreSQL and Redis are not unnecessarily exposed directly to the host through the application architecture.

## 12. Kubernetes Architecture

Kubernetes manifests are stored under:

```text
k8s/
```

The current Kubernetes configuration includes:

* Namespace
* Backend Deployment
* Frontend Deployment
* PostgreSQL
* Redis
* ConfigMap
* Secrets
* Ingress
* PodDisruptionBudget
* Horizontal Pod Autoscaler
* Vertical Pod Autoscaler

The backend HPA provides horizontal scaling based on resource utilization.

The VPA configuration provides resource recommendation/configuration for the backend.

## 13. Autoscaling Evidence

The repository includes k6 load-testing material:

```text
load/k6-hpa-test.js
```

Recorded evidence is stored under:

```text
evidence/
```

including:

```text
hpa-samples.csv
k6-metrics.json
hpa-replicas-vs-load.png
```

These artifacts document the load-testing/HPA work performed for the project.

## 14. Container Images

The project produces separate backend and frontend container images.

The CI/CD workflow publishes SHA-tagged images to GitHub Container Registry.

Using the commit SHA as the image tag provides an immutable reference to the exact source revision used to build an image.

The related architectural decision is documented in:

```text
docs/adr/ADR-004-deploy-by-sha.md
```

## 15. CI/CD

GitHub Actions workflows are located under:

```text
.github/workflows/
```

The CI workflow performs backend and frontend validation.

The container publishing workflow builds and publishes container images to GHCR.

The repository also contains Docker Compose deployment automation.

Kubernetes deployment manifests are maintained under:

```text
k8s/
```

The Compose deployment path and Kubernetes configuration should be considered separate operational paths.

## 16. Architecture Decisions

Current ADRs:

```text
docs/adr/
├── ADR-001-pii-data-governance.md
├── ADR-002-provider-interface.md
├── ADR-003-frontend-runtime-config.md
└── ADR-004-deploy-by-sha.md
```

These documents record important architectural decisions instead of relying only on implementation code.

## 17. Testing

Backend tests are divided into:

```text
backend/tests/unit/
backend/tests/integration/
```

The CI pipeline runs the backend test suite.

Frontend tests are also executed through the frontend CI workflow.

## 18. Development Workflow

Feature work is developed using branches and Pull Requests.

The expected workflow is:

```text
Issue
  |
  v
Feature branch
  |
  v
Implementation
  |
  v
Tests
  |
  v
Pull Request
  |
  v
Review
  |
  v
Merge
```

This keeps implementation changes traceable to project tasks.

## 19. Documentation

Operational information is maintained in:

```text
README.md
RUNBOOK.md
ENGINEERING-NOTES.md
docs/adr/
```

The README provides project-level information.

The RUNBOOK provides operational procedures.

ENGINEERING-NOTES documents important implementation and architecture decisions.

ADRs record significant architectural decisions and their rationale.

## 20. Current Deployment Model

CivicPulse currently maintains both:

### Docker Compose

Used for local and Compose-based deployment.

```text
Docker Compose
├── frontend
├── backend
├── postgres
└── redis
```

### Kubernetes

The repository contains Kubernetes manifests for:

```text
Kubernetes
├── frontend
├── backend
├── postgres
├── redis
├── ingress
├── HPA
├── VPA
└── PDB
```

The Kubernetes manifests, GHCR image publishing, and Compose deployment workflow are maintained as separate infrastructure concerns.

Production deployment should use the deployment path explicitly configured for the target environment rather than assuming that the presence of Kubernetes manifests means that the Compose deployment workflow has been replaced.
