# RecoverAI — Batch Recovery Evaluation Engine (Phase 7)

## Overview

The **Batch Recovery Evaluation Engine** allows merchants and hackathon evaluators to benchmark **RecoverAI** across large synthetic recovery workloads (100+ cases).
It measures money at risk, simulated money recovered, revenue recovery rates, policy block rates, stopping rules, and audit completeness.

---

## Key Safety Distinctions

`
SIMULATION MODE  ---> Uses deterministic simulated outcomes. No live payments or Razorpay calls.
RAZORPAY TEST    ---> Uses Razorpay Test Mode integration for manual verification.
`

> **CRITICAL RULE:** Every displayed metric and report explicitly distinguishes **SIMULATED RECOVERY** from **VERIFIED RAZORPAY TEST-MODE RECOVERY**.

---

## Dataset & Concurrency

- **Dataset Size:** 100+ deterministic synthetic recovery cases (BATCH-CASE-001 to BATCH-CASE-100).
- **Diverse Issue Types:** PAYMENT_FAILURE, CHECKOUT_ABANDONMENT, SUBSCRIPTION_FAILURE, OVERDUE_RECEIVABLE, MANDATE_FAILURE.
- **Diverse Risk Profiles:** LOW, MEDIUM, HIGH, CRITICAL.
- **Controlled Concurrency:** Maximum 5 cases processed concurrently to prevent database or event loop lockups.

---

## Formulations & Metrics

### 1. Revenue Recovery Rate (%)
\text{Revenue Recovery Rate} = \frac{\text{Total Recovered Amount (Paise)}}{\text{Total Amount At Risk (Paise)}} \times 100

### 2. Case Recovery Rate (%)
\text{Case Recovery Rate} = \frac{\text{Successful Case Recoveries}}{\text{Total Cases Processed}} \times 100

---

## Evaluation API Endpoints

- POST /api/evaluations/batches: Creates a new evaluation batch.
- POST /api/evaluations/batches/:batchId/run: Launches batch evaluation in background.
- GET /api/evaluations/batches: Lists evaluation batches.
- GET /api/evaluations/batches/:batchId: Summary metrics and status.
- GET /api/evaluations/batches/:batchId/results: Paginated case-level results.
- GET /api/evaluations/batches/:batchId/report: Structured report and breakdowns.

---

## Idempotency & Safety

- Batches use a unique atchId.
- Re-running a completed batch returns existing results without re-processing cases or duplicating recovered revenue.
- Individual case errors are isolated so one bad case never crashes the batch.

---

## Audit Coverage

Each case processed produces immutable audit logs (BATCH_CASE_STARTED, RISK_CALCULATED, DIAGNOSIS_COMPLETED, AI_DECISION_COMPLETED, POLICY_CHECKED, PAYMENT_RECOVERY_CONFIRMED, BATCH_CASE_COMPLETED).
