# RecoverAI Copilot — Architecture & Safety Specification

> **"Natural language operator assistant with strict financial safety guardrails."**

---

## 1. Overview & Non-Negotiable Safety Rule

RecoverAI Copilot provides merchants and recovery operators with a natural-language interface to query recovery data, understand case details, and review policy decisions.

> **CRITICAL SAFETY RULE:** The Copilot **MUST NOT** directly execute financial recovery actions (calling Razorpay payment APIs, retrying payments, creating payment links, modifying case states directly, or overriding policies).

If a user requests a financial action (e.g., *"Retry payment for RC-1002"*), the Copilot returns a safe policy explanation:

> *"I can analyze the case and explain the recovery policy, but financial recovery actions must go through RecoverAI's policy-controlled recovery workflow."*

---

## 2. Copilot Architecture

```
Merchant / Operator Query
         │
    POST /api/copilot/chat (JWT Authenticated)
         │
    Feature Flag Check (COPILOT_ENABLED)
         │
    Input Sanitization & Injection Defense (<UNTRUSTED_CUSTOMER_DATA>)
         │
    Financial Action Intent Detector (isFinancialActionIntent)
         │
  ├── [Financial Intent Detected] ──> Return Policy Refusal Explanation
  │
  └── [Read-Only Intent] ──────────> Tool Selection (APPROVED_TOOLS Allowlist)
                                          │
                                     Backend Execution (DB Aggregations Only)
                                          │
                                     Response Formatting (Gemini 2.5 / Simulation)
                                          │
                                     Structured Response to Copilot UI
```

---

## 3. Approved Tool Allowlist (`APPROVED_TOOLS`)

Every tool in the Copilot registry defines `readOnly: true` and `financialImpact: false`:

| Tool Name | Description | Read-Only | Financial Impact |
|---|---|---|---|
| `get_dashboard_metrics` | Aggregated revenue at risk, recovered revenue, and case counts | `true` | `false` |
| `get_recovery_cases` | Filtered list of recovery cases by status or risk level | `true` | `false` |
| `get_recovery_case` | Comprehensive case details (risk, diagnosis, recommendation, policy, audit) | `true` | `false` |
| `get_evaluation_summary` | Benchmark metrics from the latest batch evaluation run | `true` | `false` |
| `run_demo_evaluation` | Triggers a synthetic 100-case evaluation benchmark in simulation mode | `false` | `false` |

---

## 4. Feature Flag Control

RecoverAI Copilot is controlled via the `COPILOT_ENABLED` environment variable:
- `COPILOT_ENABLED=true` (default): Copilot API and UI enabled.
- `COPILOT_ENABLED=false`: Copilot API returns `403 Forbidden` and Copilot widget is disabled. The core RecoverAI recovery engine continues operating cleanly.

---

## 5. Security & Isolation
1. **User Identity:** Resolves identity strictly from server-side JWT session token (`req.user`).
2. **Prompt Injection Defense:** Input is sanitized and stripped of HTML/script tags.
3. **Zero Secret Exposure:** Secrets (`GEMINI_API_KEY`, `RAZORPAY_KEY_SECRET`, `JWT_SECRET`) are never included in tool payloads or sent to frontend.
