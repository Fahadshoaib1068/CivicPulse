# ADR-002: Triage Provider Interface

- Status: Accepted
- Date: 2026-09-27

## Context

CivicPulse needs to classify incoming complaint text into categories and priority levels, but the implementation strategy may vary over time. The application may use a rules engine, a simulated provider, or an external LLM-backed provider depending on configuration, cost, and reliability requirements.

A hard-coded triage implementation would make it difficult to switch providers safely and would entangle the service layer with provider-specific logic.

## Decision

We will define a provider contract that is narrow, explicit, and dependency-light. The interface is implemented as a `Protocol` in `backend/app/providers/triage/base.py`.

The contract requires the following:

- a `name` field
- a `triage(text: str, location: str) -> TriageResult` method

The `TriageResult` model includes:

- `category`
- `priority`
- `summary`
- `confidence`

The provider is resolved at runtime by `backend/app/providers/triage/factory.py` from the `TRIAGE_PROVIDER` environment variable. The default provider on this branch is `rules`.

The application service layer in `backend/app/services/triage_service.py` wraps the selected provider and applies a fallback to the rule-based implementation when the configured provider fails.

## Consequences

### Positive

- The backend can switch providers without changing the complaint service interface.
- Fallback logic is centralized and observable.
- New providers can be introduced with a small, consistent surface area.

### Negative

- Provider behavior remains dependent on runtime configuration and environment variables.
- The protocol does not guarantee provider quality or interoperability beyond the shared result contract.
- Each provider must still implement the same output semantics and validation rules.

## Follow-up

This decision should be reviewed when a provider adds new output fields, requires additional context beyond `text` and `location`, or when the fallback contract changes.
