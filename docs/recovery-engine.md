# RecoverAI — Recovery Engine Architecture (Phase 3)

## Overview

The RecoverAI Recovery Engine provides a deterministic, rule-based, and policy-bounded intelligence framework for detecting revenue at risk, diagnosing root causes, determining recovery recommendations, enforcing business guardrails, generating recovery plans, and maintaining auditability.

---

## Processing Flow Diagram

```
+------------------+
|  Recovery Case   |
+--------+---------+
         |
         v
+------------------+
|   Risk Scoring   |  (calculateRiskScore -> 0-100 & LOW/MEDIUM/HIGH/CRITICAL)
+--------+---------+
         |
         v
+------------------+
|    Diagnosis     |  (diagnoseCase -> probableCause & recoverability)
+--------+---------+
         |
         v
+------------------+
| AI Decision Eng. |  (generateRecommendation -> RETRY/LINK/REMINDER/ESCALATE/STOP)
+--------+---------+
         |
         v
+------------------+
|  Policy Engine   |  (evaluateRecoveryAction -> checks limits & stopping rules)
+--------+---------+
         |
         v
+------------------+
|  Recovery Plan   |  (Structured Plan Object)
+--------+---------+
         |
         v
+------------------+
|   Orchestrator   |  (State Machine Transitions & Database Persistence)
+--------+---------+
         |
         v
+------------------+
| Action Executor  |  (Boundary Layer: Phase 3 SIMULATION ONLY)
+--------+---------+
         |
         v
+------------------+
|    Audit Log     |  (Immutable AuditLog Event Creation)
+------------------+
```

---

## Component Boundaries

### 1. Risk Scoring Service (`server/src/services/riskScoringService.js`)
Calculates a transparent 0-100 risk score and assigns a risk level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
Factors evaluated:
- Amount at risk (e.g. > ₹10,000 / > ₹50,000)
- Failure attempt count and hard decline signals (e.g., `CARD_DECLINED`, `ACCOUNT_FROZEN`)
- Customer status (`INACTIVE`, `BLOCKED`) and historical LTV
- Existing case escalation level and retry attempts

### 2. Diagnosis Service (`server/src/services/recoveryDiagnosisService.js`)
Classifies the issue and probable root cause:
- `PAYMENT_METHOD_FAILURE`
- `INSUFFICIENT_FUNDS`
- `BANK_DECLINE`
- `MANDATE_FAILURE`
- `TEMPORARY_PROVIDER_FAILURE`
- `CHECKOUT_ABANDONMENT`
- `CUSTOMER_DELAY`
- `UNKNOWN`

Separates confirmed facts from inferences and rate of recoverability (`HIGH`, `MEDIUM`, `LOW`, `NONE`).

### 3. AI & Fallback Decision Engines (`server/src/services/aiDecisionEngine.js` & `fallbackDecisionEngine.js`)
Proposes an action from the permitted enum:
- `RETRY_PAYMENT`
- `CREATE_PAYMENT_LINK`
- `SEND_REMINDER`
- `ESCALATE`
- `STOP`

Operates deterministically in Phase 3 without external AI API dependencies.

### 4. Policy Engine (`server/src/services/policyEngine.js`)
**The safety guardrail layer.** Enforces business limits:
- Maximum retries per case (`maxRetries`)
- Maximum reminders per case (`maxReminders`)
- Active recovery window duration (`recoveryWindowHours`)
- Maximum escalation level (`maxEscalationLevel`)
- Immediate stopping rules on payment recovery, customer opt-out, or terminal state

> **CRITICAL RULE:** The AI Decision Engine cannot bypass Policy Engine rules.

### 5. Recovery State Machine (`server/src/services/stateMachine.js`)
Controls state transitions across valid case lifecycles:
`OPEN` → `ANALYZING` → `ACTION_PENDING` → `IN_RECOVERY` → `RECOVERED` / `ESCALATED` / `EXPIRED` → `CLOSED`

Prevents illegal transitions and blocks processed terminal states (`CLOSED`, `RECOVERED`, `EXPIRED`) from re-entering active recovery.

### 6. Action Executor Boundary (`server/src/services/actionExecutor.js`)
Interface boundary for future execution steps.
- **Phase 3 Mode:** Operates strictly in `SIMULATION` mode.
- Returns `{ executed: false, mode: "SIMULATION", action: "...", reason: "..." }`.
- No real Razorpay or notification APIs are called.

### 7. Audit Service (`server/src/services/auditService.js`)
Appends immutable `AuditLog` events for:
- `CASE_ANALYSIS_STARTED`
- `RISK_CALCULATED`
- `DIAGNOSIS_COMPLETED`
- `ACTION_RECOMMENDED`
- `POLICY_CHECKED`
- `ACTION_BLOCKED`
- `STOPPING_RULE_TRIGGERED`
- `RECOVERY_PLAN_CREATED`

---

## API Testing Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/recovery/cases/:caseId/analyze` | Executes Phase 3 analysis & orchestration in simulation mode |
| GET | `/api/recovery/cases/:caseId/plan` | Fetches generated recovery plan simulation |
| POST | `/api/recovery/cases/:caseId/simulate-action` | Simulates executing a permitted action (returns simulation payload) |

---

## Future Phase Integration

In Phase 4/5, the `actionExecutor.js` boundary will connect to real Razorpay Test Mode webhooks and payment link creation APIs, while `aiDecisionEngine.js` will connect to structured LLM outputs.
