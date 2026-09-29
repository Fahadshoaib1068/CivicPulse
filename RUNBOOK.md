# CivicPulse Runbook

This runbook describes the operational procedures for running and troubleshooting CivicPulse.

## 1. Local Docker Compose Deployment

The primary local deployment method is Docker Compose.

From the repository root:

```powershell
docker compose up --build
```

Check running services:

```powershell
docker compose ps
```

View logs:

```powershell
docker compose logs
```

View backend logs:

```powershell
docker compose logs backend
```

View frontend logs:

```powershell
docker compose logs frontend
```

View PostgreSQL logs:

```powershell
docker compose logs postgres
```

View Redis logs:

```powershell
docker compose logs redis
```

## 2. Service Health

### Backend

Health:

```text
http://localhost:8000/health
```

Readiness:

```text
http://localhost:8000/ready
```

API documentation:

```text
http://localhost:8000/docs
```

Metrics:

```text
http://localhost:8000/metrics
```

### Frontend

```text
http://localhost:5173
```

When running through the production Compose configuration, the frontend is exposed through the configured production port.

## 3. Database

PostgreSQL is provided as a Compose service.

Check:

```powershell
docker compose ps postgres
```

Inspect database logs:

```powershell
docker compose logs postgres
```

Database migrations are managed through Alembic.

Typical migration command from the backend environment:

```powershell
alembic upgrade head
```

## 4. Redis

Redis provides caching and distributed rate-limiting support.

Check:

```powershell
docker compose ps redis
```

Inspect logs:

```powershell
docker compose logs redis
```

## 5. Restarting Services

Restart the complete Compose stack:

```powershell
docker compose restart
```

Restart only the backend:

```powershell
docker compose restart backend
```

Restart only Redis:

```powershell
docker compose restart redis
```

Restart only PostgreSQL:

```powershell
docker compose restart postgres
```

## 6. Rebuilding

After changing backend or frontend code:

```powershell
docker compose up --build
```

To remove the current containers and recreate them:

```powershell
docker compose down
docker compose up --build
```

Persistent database and Redis volumes should not be removed unless data reset is intentionally required.

## 7. Kubernetes

Kubernetes manifests are stored under:

```text
k8s/
```

The base configuration contains:

* Backend
* Frontend
* PostgreSQL
* Redis
* ConfigMap
* Secrets
* Ingress
* HPA
* VPA
* PDB

The repository also contains development and production overlay directories.

Before applying Kubernetes manifests, verify that the target cluster is available:

```powershell
kubectl cluster-info
```

Check nodes:

```powershell
kubectl get nodes
```

Check workloads:

```powershell
kubectl get pods -A
```

Check CivicPulse resources:

```powershell
kubectl get all -n civicpulse
```

## 8. HPA

The backend HPA is defined in:

```text
k8s/base/hpa.yaml
```

Check HPA status:

```powershell
kubectl get hpa -n civicpulse
```

Detailed HPA information:

```powershell
kubectl describe hpa -n civicpulse
```

The repository contains load-testing and HPA evidence under:

```text
load/
evidence/
```

## 9. VPA

The backend VPA is defined in:

```text
k8s/base/vpa.yaml
```

Check VPA resources:

```powershell
kubectl get vpa -n civicpulse
```

Describe the VPA:

```powershell
kubectl describe vpa -n civicpulse
```

## 10. Kubernetes Troubleshooting

Check pods:

```powershell
kubectl get pods -n civicpulse
```

Describe a failing pod:

```powershell
kubectl describe pod <pod-name> -n civicpulse
```

View pod logs:

```powershell
kubectl logs <pod-name> -n civicpulse
```

Check recent events:

```powershell
kubectl get events -n civicpulse --sort-by=.lastTimestamp
```

Check deployments:

```powershell
kubectl get deployments -n civicpulse
```

Check services:

```powershell
kubectl get svc -n civicpulse
```

## 11. CI/CD

GitHub Actions workflows are stored in:

```text
.github/workflows/
```

CI validates backend and frontend changes.

The container publishing workflow builds and publishes SHA-tagged backend and frontend images to GitHub Container Registry.

The repository also contains Docker Compose deployment automation.

Kubernetes manifests are maintained separately under:

```text
k8s/
```

## 12. Observability

CivicPulse provides:

* Structured JSON logs
* Request IDs
* Request latency
* Health checks
* Readiness checks
* Metrics
* Graceful shutdown

When debugging an API request, check the request ID and corresponding backend log entry.

## 13. Common Problems

### Backend does not start

Check:

```powershell
docker compose logs backend
```

Verify:

* Database connection configuration
* Redis connection configuration
* Required environment variables
* Alembic migration state

### PostgreSQL is unhealthy

Check:

```powershell
docker compose logs postgres
```

Then:

```powershell
docker compose ps postgres
```

### Redis is unhealthy

Check:

```powershell
docker compose logs redis
```

Then:

```powershell
docker compose ps redis
```

### Frontend cannot reach backend

Check the frontend API configuration and verify that the backend is available through:

```text
http://localhost:8000
```

Also inspect the browser developer console and backend logs.

### Kubernetes cluster is unavailable

Check:

```powershell
kubectl cluster-info
```

Then:

```powershell
kubectl get nodes
```

If the Kubernetes control plane is unavailable, fix the cluster before troubleshooting CivicPulse workloads.

## 14. Data Safety

Do not commit:

* API keys
* Database passwords
* LLM provider credentials
* Production secrets
* Personal/private credentials

Use environment variables or Kubernetes Secrets for sensitive configuration.

Architecture and data-governance decisions are documented under:

```text
docs/adr/
```
