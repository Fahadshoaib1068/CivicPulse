# ADR-001: PII and Data Governance for CivicPulse

- Status: Accepted
- Date: 2026-09-26

## Context

CivicPulse ingests citizen complaints that may contain personally identifiable information (PII), such as names, phone numbers, precise addresses, or other contact details. These records may be used for internal triage, analytics, and operational follow-up, but they must be stored and processed in a way that preserves trust, minimizes exposure, and supports lawful data handling.

The system also relies on AI-assisted triage and caching to classify complaint text. Because complaint content can include sensitive data, the platform must prevent unnecessary retention, avoid exposing raw PII in logs or caches, and define clear operational controls for access, retention, and deletion.

## Decision

We will treat complaint payloads as potentially sensitive operational data and enforce the following controls:

1. PII minimization
   - Store only the fields required to support complaint handling, analytics, and workflow operations.
   - Avoid persisting redundant or debug copies of raw complaint text in unscoped logs or caches.

2. Redaction in operational logs
   - Structured application logs must not include raw complaint bodies or free-form user content unless explicitly required for an incident investigation.
   - When log output must reference complaint data, redact names, phone numbers, email addresses, and exact addresses before writing them to the logs.

3. Cache safety
   - AI content-hash caching may use a derived hash of the complaint source text rather than the raw message itself.
   - Cache values must be treated as non-authoritative and must not be used as a durable record of personal data.

4. Retention and deletion
   - Complaint records will be kept only for the operational lifetime needed to resolve or report the issue.
   - A deletion or purge process must be available for records that are no longer needed for investigation, compliance, or statutory obligations.

5. Access controls
   - Access to complaint records and derived reports is limited to authorized operators and service accounts.
   - Database or application-level access should follow least-privilege patterns and should be reviewed through deployment and maintenance processes.

6. Governance and review
   - Data handling changes affecting complaint ingestion, AI triage, or analytics must be reviewed before rollout.
   - Privacy and governance reviews are required when introducing new data fields, external integrations, or storage locations.

## Consequences

### Positive

- Reduces the chance of exposing PII through logs, cache entries, or debug output.
- Aligns the platform with common privacy-by-design expectations for civic or public-service systems.
- Keeps the AI triage flow focused on classification while limiting unnecessary raw data retention.

### Negative

- Some operational debugging will require structured metadata rather than raw complaint text.
- Data deletion and retention enforcement require additional maintenance discipline and monitoring.
- The system must maintain explicit governance review for future integrations or data model changes.

## Follow-up

This ADR should be reviewed whenever the platform adds new complaint fields, introduces a new external AI provider, or changes retention or deletion policies.
