# CivicPulse Triage System

## 1. Overview

CivicPulse uses an AI-assisted complaint triage system to automatically analyze submitted complaints and assign structured triage information.

The triage system is designed around a provider abstraction so that the application does not depend directly on a single AI implementation. The backend can select different triage providers through the provider factory.

The current implementation contains three provider implementations:

1. `RuleBasedTriage`
2. `SimulatedTriage`
3. `LLMTriage`

The provider interface is defined by `TriageProvider`.

This design allows the complaint service to use a common interface regardless of which triage implementation is selected.

---

## 2. Triage Architecture

The main triage components are located under:

```text
backend/app/providers/triage/
├── factory.py
├── llm.py
├── rules.py
└── simulated.py
```

The main application flow is:

```text
User submits complaint
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
        v
Triage Provider Factory
        |
        +-------------------+
        |                   |
        v                   v
 RuleBasedTriage       SimulatedTriage
        |
        v
    LLMTriage
        |
        v
Structured Triage Result
        |
        v
Complaint stored/returned
```

The provider abstraction keeps provider-specific logic separate from the rest of the complaint processing system.

---

## 3. TriageProvider Interface

The triage providers follow the common `TriageProvider` abstraction.

The purpose of this interface is to ensure that the complaint service can request triage without knowing the internal implementation of the selected provider.

This provides:

* Provider interchangeability
* Separation of concerns
* Easier testing
* Easier replacement of the AI provider
* Support for deterministic testing through the simulated provider

The complaint service therefore works with the provider abstraction instead of directly depending on a specific AI implementation.

---

## 4. RuleBasedTriage

`RuleBasedTriage` provides deterministic rule-based complaint classification.

This provider does not require an external AI service. It can classify complaints using predefined rules and is useful when deterministic behavior is required.

The rule-based provider is useful for:

* Local development
* Testing
* Fallback behavior
* Predictable results
* Environments where an external LLM is unavailable

Because the rules are deterministic, the same complaint input can produce repeatable results.

---

## 5. SimulatedTriage

`SimulatedTriage` is provided primarily for deterministic testing and CI environments.

It allows the application to exercise the triage workflow without requiring a live external LLM service.

This is important because automated tests should not depend on:

* Internet connectivity
* External API availability
* API credentials
* External service response time
* External service cost

The simulated provider therefore makes the triage functionality suitable for repeatable automated testing.

---

## 6. LLMTriage

`LLMTriage` provides the LLM-based triage implementation.

The implementation integrates the external LLM provider through the application's triage abstraction rather than exposing the external provider directly to the complaint service.

The LLM provider is responsible for obtaining a structured triage result from the model.

The resulting information is used by the application for complaint categorization and prioritization.

The implementation also includes handling for failures when communicating with the LLM service.

---

## 7. Provider Factory

Provider selection is handled by:

```text
backend/app/providers/triage/factory.py
```

The factory centralizes provider creation.

Instead of creating providers throughout the application, the application can request a provider from the factory.

This provides a single location for provider-selection logic and makes it easier to change the active triage implementation.

The supported implementations include:

```text
RuleBasedTriage
SimulatedTriage
LLMTriage
```

The factory also supports the application's configured provider selection.

---

## 8. Triage Service

The triage workflow is coordinated by the backend triage service.

The service provides the layer between the complaint-processing logic and the individual triage providers.

This separation means that provider-specific functionality such as LLM communication does not need to be implemented inside the complaint service.

The triage service also handles reliability-related behavior around provider calls.

---

## 9. Retry and Failure Handling

The LLM triage implementation includes failure handling for temporary provider failures.

The implementation supports retry behavior for transient failures such as:

* Request timeouts
* HTTP 429 responses
* HTTP 5xx responses

The retry behavior is intended for temporary failures rather than permanent application errors.

The implementation also uses fallback behavior so that a temporary LLM/provider failure does not necessarily prevent the complaint from being processed.

This improves the resilience of the complaint submission workflow.

---

## 10. Caching

CivicPulse uses Redis as part of the triage workflow.

Triage results can be cached so that repeated requests for the same input do not unnecessarily require another provider call.

The cache provides two main benefits:

1. Reduced repeated provider calls
2. Improved response performance for repeated requests

Redis is integrated into the backend infrastructure through the application's Compose/Kubernetes deployment configuration.

---

## 11. Structured Triage Output

The triage process produces structured information rather than returning an unstructured block of text.

The complaint workflow uses triage information such as:

* Category
* Priority
* Summary
* Provider information

The structured result allows the frontend and backend to consistently consume the triage result.

For example, after submitting a complaint, the frontend can display information returned by the backend including the assigned category, priority, summary, and provider.

---

## 12. Prompt-Injection Protection

Because the LLM provider processes user-submitted complaint text, the input cannot automatically be treated as trusted instructions.

The triage implementation includes protection intended to prevent complaint text from overriding the intended triage instructions.

The complaint is treated as data to be analyzed rather than as instructions controlling the model.

This is important because complaint text is user-controlled input and may contain text attempting to manipulate the LLM's behavior.

---

## 13. Triage Flow

The overall complaint triage flow is:

```text
1. User submits a complaint
              |
              v
2. Complaint API receives the request
              |
              v
3. Complaint service processes the complaint
              |
              v
4. Triage service is invoked
              |
              v
5. Provider factory selects the configured provider
              |
              v
6. Selected provider analyzes the complaint
              |
              v
7. Structured triage result is returned
              |
              v
8. Result is used by the complaint workflow
              |
              v
9. Triage information can be returned to the frontend
```

For an LLM-based request, the provider communication additionally involves retry/fallback and caching behavior.

---

## 14. Why Provider Abstraction Was Used

The provider abstraction was selected to avoid tightly coupling CivicPulse to one AI provider.

Without the abstraction, the complaint service would need to know how to communicate with a specific LLM implementation.

With the abstraction:

```text
Complaint Service
       |
       v
TriageProvider
       |
       +---- RuleBasedTriage
       |
       +---- SimulatedTriage
       |
       +---- LLMTriage
```

This makes the system easier to:

* Test
* Extend
* Maintain
* Replace providers
* Run without external AI services

A new provider can be introduced by implementing the same provider contract and integrating it with the factory.

---

## 15. Testing Strategy

The simulated and rule-based providers are particularly useful for deterministic testing.

Tests can exercise complaint triage behavior without depending on a live external LLM service.

The backend test suite also tests complaint API behavior and service functionality.

Testing the provider abstraction separately from the external provider integration helps isolate application logic from external service behavior.

For CI, a deterministic provider is preferable because it avoids making the pipeline dependent on external AI availability.

---

## 16. Operational Considerations

The triage system depends on the backend configuration and, for LLM-based operation, the configured external AI service.

When troubleshooting triage:

1. Verify the backend is running.
2. Verify the selected provider configuration.
3. Verify required environment variables.
4. Check backend logs for provider failures.
5. Check Redis availability when caching is enabled.
6. If the external LLM provider is unavailable, use the supported fallback/deterministic provider where configured.

The simulated provider can also be used when external AI access is not appropriate for testing.

---

## 17. Main Implementation Files

| Component           | File                                        |
| ------------------- | ------------------------------------------- |
| Provider factory    | `backend/app/providers/triage/factory.py`   |
| LLM provider        | `backend/app/providers/triage/llm.py`       |
| Rule-based provider | `backend/app/providers/triage/rules.py`     |
| Simulated provider  | `backend/app/providers/triage/simulated.py` |
| Complaint service   | `backend/app/services/complaint_service.py` |
| Triage service      | `backend/app/services/triage_service.py`    |
| Complaint API       | `backend/app/routes/complaints.py`          |

---

## 18. Summary

CivicPulse implements AI-assisted complaint triage using a provider-based architecture.

The system currently provides:

* A common `TriageProvider` abstraction
* Rule-based triage
* Simulated triage for deterministic testing
* LLM-based triage
* Centralized provider selection through a factory
* Structured triage results
* Retry handling for transient provider failures
* Fallback behavior
* Redis-based caching
* Prompt-injection protection

This architecture keeps AI-provider logic separated from the core complaint workflow while allowing CivicPulse to use different triage implementations for production, testing, and fallback scenarios.
