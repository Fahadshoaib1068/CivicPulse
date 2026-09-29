# CivicPulse

CivicPulse is a civic complaint intake and AI-assisted triage platform built for the Software Construction and Design course.

The system allows citizens to submit complaints and provides an operations dashboard for reviewing, filtering, updating, and analyzing complaints. Submitted complaints are processed through a replaceable triage-provider architecture that can use rule-based, simulated, or LLM-based triage with fallback behavior.

## Technology Stack

### Backend

* Python 3.12
* FastAPI
* Pydantic
* SQLAlchemy
* Alembic
* PostgreSQL
* Redis
* Pytest

### Frontend

* React
* TypeScript
* Vite

### AI / Triage

* Replaceable `TriageProvider` abstraction
* Rule-based triage
* Simulated triage
* LLM-based triage
* Retry and fallback handling
* Redis-backed triage caching

### Infrastructure

* Docker
* Docker Compose
* Kubernetes
* Kustomize-style base/overlay structure
* Kubernetes HPA
* Kubernetes VPA
* Kubernetes PDB
* Kubernetes Ingress
* GitHub Actions
* GitHub Container Registry (GHCR)
* k6 load testing

## Main Features

### Citizen Complaint Submission

Citizens can submit complaints containing:

* Complaint text
* Location
* Reporter contact information

The backend validates the submission and automatically performs triage.

### AI-Assisted Triage

Each complaint can receive:

* Category
* Priority
* AI-generated summary
* Triage provider information

The triage system is designed around a provider abstraction so providers can be replaced without changing the complaint workflow.

The repository currently includes:

* Rule-based triage
* Simulated triage
* LLM-based triage

Retry and fallback behavior is used when the preferred provider cannot complete the request.

### Operations Dashboard

The frontend provides an operations dashboard for:

* Viewing complaints
* Filtering by category
* Filtering by priority
* Filtering by status
* Pagination
* Updating complaint status
* Viewing complaint statistics

### Statistics

The statistics view provides aggregated complaint information including:

* Total complaints
* Categories
* Priorities
* Complaint distributions
* Cache status

### Caching and Rate Limiting

Redis is used for:

* Triage caching
* Complaint-related caching
* Distributed rate limiting

### Observability

The backend includes:

* Structured JSON logging
* Request IDs
* Request latency information
* Health endpoint
* Readiness endpoint
* Metrics endpoint
* Graceful application shutdown

## Project Structure

```text
civicpulse/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── providers/
│   │   └── ...
│   └── tests/
│       ├── unit/
│       └── integration/
│
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       └── types/
│
├── k8s/
│   ├── base/
│   │   ├── backend.yaml
│   │   ├── frontend.yaml
│   │   ├── postgres.yaml
│   │   ├── redis.yaml
│   │   ├── hpa.yaml
│   │   ├── vpa.yaml
│   │   ├── ingress.yaml
│   │   └── pdb.yaml
│   └── overlays/
│       ├── dev/
│       └── prod/
│
├── load/
│   └── k6-hpa-test.js
│
├── evidence/
│   ├── hpa-samples.csv
│   ├── k6-metrics.json
│   └── hpa-replicas-vs-load.png
│
├── docs/
│   └── adr/
│       ├── ADR-001-pii-data-governance.md
│       ├── ADR-002-provider-interface.md
│       ├── ADR-003-frontend-runtime-config.md
│       └── ADR-004-deploy-by-sha.md
│
├── compose.yaml
├── compose.prod.yaml
└── .github/
    └── workflows/
```

## Running Locally

### Backend

From the repository root:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

Backend documentation:

```text
http://127.0.0.1:8000/docs
```

Health:

```text
http://127.0.0.1:8000/health
```

Readiness:

```text
http://127.0.0.1:8000/ready
```

### Frontend

From the repository root:

```powershell
cd frontend
npm install
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:5173
```

## Docker Compose

The repository includes a Compose-based local deployment containing:

* PostgreSQL
* Redis
* Backend
* Frontend

The Compose configuration uses separate edge and internal networks so that internal services are not unnecessarily exposed.

Start the stack with:

```powershell
docker compose up --build
```

Production Compose configuration is provided through:

```text
compose.prod.yaml
```

## Kubernetes

The repository also contains Kubernetes deployment manifests under:

```text
k8s/
```

The Kubernetes configuration includes:

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

The HPA targets the backend workload and scales according to CPU utilization.

The repository also contains k6-based load-testing material and recorded HPA evidence under:

```text
load/
evidence/
```

The Kubernetes manifests are maintained separately from the Docker Compose deployment path.

## CI/CD

GitHub Actions workflows are located under:

```text
.github/workflows/
```

The CI workflow performs automated backend and frontend checks.

The container publishing workflow builds backend and frontend images and publishes SHA-tagged images to GitHub Container Registry.

SHA-based image tagging provides immutable image references that can be used when deploying a specific commit.

The current repository also retains Docker Compose deployment automation. Kubernetes manifests are maintained in the repository for Kubernetes-based deployment and scaling.

## Architecture Decisions

Architecture decisions are documented under:

```text
docs/adr/
```

Current ADRs include:

* PII and data governance
* Triage provider abstraction
* Frontend runtime configuration
* Deploy-by-SHA strategy

## Testing

Backend tests are organized into:

```text
backend/tests/unit/
backend/tests/integration/
```

Frontend tests are included in the frontend project and are executed through the CI workflow.

## Load Testing

k6 is used for Kubernetes/HPA load testing.

The current load-testing script is:

```text
load/k6-hpa-test.js
```

Recorded evidence is stored under:

```text
evidence/
```

including HPA replica/load samples and k6 metrics.

## Development Workflow

Development follows a feature-branch and pull-request workflow.

Typical workflow:

```text
feature branch
      ↓
implementation
      ↓
tests
      ↓
Pull Request
      ↓
review
      ↓
merge
```

Issues are used to track project work and Pull Requests are used to integrate completed changes.

## Current Deployment Scope

CivicPulse currently supports two infrastructure paths:

1. Docker Compose for local/production Compose-based operation.
2. Kubernetes manifests for container orchestration, scaling, networking, persistence, and deployment configuration.

The Kubernetes manifests and GHCR image publishing are part of the repository. The exact production deployment mechanism should be treated separately from the Compose deployment workflow.
