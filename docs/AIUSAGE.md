# CivicPulse AI Usage

## 1. Purpose

CivicPulse uses AI-assisted triage to analyze citizen complaints and generate structured information that can help organize and prioritize submitted complaints.

The AI component is used as an assistance mechanism within the complaint-processing workflow. It does not replace the application's core business logic or database workflow.

The triage system is implemented behind a provider abstraction so that CivicPulse can operate with different triage implementations.

---

## 2. Where AI Is Used

AI-assisted processing is used in the complaint triage workflow.

When a complaint is submitted, the backend can send the complaint information to the configured triage provider. The resulting structured information can include:

* Complaint category
* Priority
* Summary
* Triage provider

The result is then handled by the backend complaint workflow and can be returned to the frontend.

The relevant implementation is located under:

```text
backend/app/providers/triage/
```

The main AI-related implementation files include:

```text
backend/app/providers/triage/factory.py
backend/app/providers/triage/llm.py
backend/app/providers/triage/rules.py
backend/app/providers/triage/simulated.py
backend/app/services/triage_service.py
```

---

## 3. Provider Abstraction

CivicPulse does not directly couple the complaint service to one particular AI provider.

Instead, the system uses the `TriageProvider` abstraction.

The available implementations include:

* `LLMTriage`
* `RuleBasedTriage`
* `SimulatedTriage`

The provider factory is responsible for selecting the configured implementation.

This architecture makes it possible to use a real LLM when required while still supporting deterministic implementations for development, testing, and fallback scenarios.

---

## 4. LLM Usage

The `LLMTriage` implementation is responsible for communication with the configured LLM service.

The LLM is used to analyze complaint content and produce structured triage information.

The application does not treat the model's response as arbitrary application instructions. The response is processed as triage data and used by the backend workflow.

The LLM integration also includes handling for temporary provider failures.

---

## 5. Deterministic Providers

CivicPulse includes non-LLM providers for situations where deterministic behavior is required.

### RuleBasedTriage

`RuleBasedTriage` uses predefined application rules rather than an external LLM.

It is useful for:

* Deterministic behavior
* Development
* Fallback behavior
* Testing

### SimulatedTriage

`SimulatedTriage` provides deterministic triage behavior for automated testing and CI.

This prevents tests from depending on:

* External AI availability
* Network connectivity
* External API credentials
* External provider response time

This allows the CI pipeline to exercise the triage workflow in a repeatable manner.

---

## 6. Reliability Measures

The AI-assisted triage workflow includes mechanisms for handling temporary provider failures.

The LLM implementation supports retry behavior for transient failures such as:

* Request timeouts
* HTTP 429 responses
* HTTP 5xx responses

Fallback behavior is also available so that a temporary external provider failure does not necessarily prevent the complaint workflow from continuing.

Redis caching is also used as part of the triage workflow to reduce unnecessary repeated provider calls.

---

## 7. Structured Output

The AI result is handled as structured triage information rather than relying on free-form text throughout the application.

The application uses information such as:

```text
Category
Priority
Summary
Provider
```

This makes the output easier for the backend and frontend to consume consistently.

Structured results also allow the complaint workflow to store and display triage information in a predictable format.

---

## 8. Prompt-Injection Protection

Complaint text is user-controlled input and therefore cannot automatically be trusted as instructions to an AI model.

The triage implementation includes protection against prompt-injection attempts.

The intended behavior is that complaint content is treated as data that should be analyzed rather than as instructions that can change the model's intended task.

This is important because a user could potentially submit complaint text containing instructions such as requests to ignore the triage task or change the expected output.

The application therefore separates the intended triage instructions from the untrusted complaint content.

---

## 9. Privacy and Data Handling

Complaint information can contain user-provided information.

The application therefore treats submitted complaint data as application data and applies the project's existing data-handling and governance decisions.

The AI provider should only receive the information required for the triage operation.

The project also documents PII/data-governance decisions through:

```text
docs/adr/ADR-001-pii-data-governance.md
```

AI processing should therefore be considered part of the application's data-processing workflow rather than an independent source of user data.

---

## 10. AI Limitations

AI-generated triage results should be treated as assistance rather than an unquestionable determination.

Potential limitations include:

* Incorrect categorization
* Incorrect priority assignment
* Ambiguous complaint descriptions
* Unexpected model responses
* External provider failures
* Changes in external model behavior

For this reason, the application maintains deterministic providers and fallback behavior rather than depending exclusively on an external LLM.

---

## 11. Testing AI-Related Functionality

AI-dependent functionality is separated from the core complaint workflow through the provider abstraction.

Automated testing can use the deterministic `SimulatedTriage` provider so that tests remain repeatable.

The testing approach avoids making normal CI execution dependent on a live external LLM service.

Tests can therefore verify application behavior without requiring an external model for every test execution.

---

## 12. AI Architecture

The simplified AI-related architecture is:

```text
                    Complaint
                       |
                       v
                Complaint Service
                       |
                       v
                 Triage Service
                       |
                       v
              TriageProvider
                       |
          +------------+------------+
          |            |            |
          v            v            v
     RuleBased     Simulated       LLM
       Triage        Triage       Triage
                                   |
                                   v
                              External LLM
                                   |
                                   v
                         Structured Result
```

The provider abstraction ensures that the rest of the application does not need to know the implementation details of each provider.

---

## 13. AI-Related Files

| Purpose              | File                                        |
| -------------------- | ------------------------------------------- |
| Provider selection   | `backend/app/providers/triage/factory.py`   |
| LLM provider         | `backend/app/providers/triage/llm.py`       |
| Rule-based provider  | `backend/app/providers/triage/rules.py`     |
| Simulated provider   | `backend/app/providers/triage/simulated.py` |
| Triage workflow      | `backend/app/services/triage_service.py`    |
| Complaint workflow   | `backend/app/services/complaint_service.py` |
| PII/data governance  | `docs/adr/ADR-001-pii-data-governance.md`   |
| Triage documentation | `docs/TRIAGE.md`                            |

---

## 14. Summary

CivicPulse uses AI-assisted complaint triage while keeping AI functionality separated from the core application through a provider abstraction.

The implementation provides:

* LLM-based triage
* Rule-based triage
* Simulated triage
* Provider factory selection
* Structured triage results
* Retry handling for transient failures
* Fallback behavior
* Redis caching
* Prompt-injection protection
* Deterministic testing through the simulated provider

This approach allows CivicPulse to benefit from AI-assisted complaint processing while maintaining testability, provider flexibility, and resilience when an external AI service is unavailable.
