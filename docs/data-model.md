# RecoverAI — Data Model Reference

## Overview

All data lives in MongoDB. Mongoose is used as the ODM layer.
All monetary values are stored as **integers in paise** (smallest INR unit).
Example: Rs 100.50 = 10050 paise. Never use floating-point for money.

---

## Collections

### 1. Customer

Represents a merchant's end-customer.

| Field | Type | Notes |
|---|---|---|
| name | String | Required |
| email | String | Required, lowercase, indexed |
| phone | String | Optional |
| externalCustomerId | String | Future Razorpay customer ID mapping. Indexed. Demo prefix: `demo_customer_` |
| status | Enum | ACTIVE / INACTIVE / BLOCKED |
| totalPayments | Number | Denormalized counter |
| successfulPayments | Number | Denormalized counter |
| failedPayments | Number | Denormalized counter |
| lifetimeValue | Number | In paise |
| lastPaymentAt | Date | |
| _isDemoData | Boolean | Hidden field. True = synthetic demo record only |
| createdAt, updatedAt | Date | Mongoose timestamps |

---

### 2. Payment

A single payment transaction attempt.

| Field | Type | Notes |
|---|---|---|
| customerId | ObjectId | Ref: Customer |
| externalPaymentId | String | Future Razorpay pay_xxx. Indexed. Demo prefix: `demo_pay_` |
| externalOrderId | String | Future Razorpay order_xxx. Demo prefix: `demo_order_` |
| amount | Number | In paise. Required. Min 1. |
| currency | String | Default: INR |
| status | Enum | CREATED / PENDING / FAILED / SUCCESS / CANCELLED / REFUNDED |
| paymentMethod | Enum | CARD / UPI / NETBANKING / WALLET / OTHER |
| failureReason | String | Human-readable failure description |
| failureCode | String | Machine-readable failure code |
| attemptCount | Number | How many times this was attempted |
| isRecoverable | Boolean | Whether recovery should be attempted |
| paidAt | Date | Set when status = SUCCESS |
| failedAt | Date | Set when status = FAILED |
| createdAt, updatedAt | Date | Mongoose timestamps |

---

### 3. RecoveryCase

The **central entity** of RecoverAI. One case per revenue-at-risk event.

| Field | Type | Notes |
|---|---|---|
| caseId | String | Human-readable ID e.g. CASE-00001. Unique. |
| customerId | ObjectId | Ref: Customer |
| paymentId | ObjectId | Ref: Payment (optional) |
| issueType | Enum | PAYMENT_FAILURE / CHECKOUT_ABANDONMENT / SUBSCRIPTION_FAILURE / OVERDUE_RECEIVABLE / MANDATE_FAILURE |
| amountAtRisk | Number | In paise. Must be > 0. |
| riskScore | Number | 0–100 |
| riskLevel | Enum | LOW / MEDIUM / HIGH / CRITICAL |
| diagnosis | String | Null until AI analysis runs. Demo data may have pre-generated text marked as illustration only. |
| recommendedAction | Enum | RETRY_PAYMENT / SEND_PAYMENT_LINK / SEND_REMINDER / ESCALATE / STOP |
| status | Enum | OPEN / ANALYZING / ACTION_PENDING / IN_RECOVERY / RECOVERED / ESCALATED / EXPIRED / CLOSED |
| retryCount | Number | Default 0 |
| reminderCount | Number | Default 0 |
| escalationLevel | Number | Default 0 |
| recoveredAmount | Number | In paise. Cannot exceed amountAtRisk. Default 0. |
| recoveryWindowStart | Date | |
| recoveryWindowEnd | Date | |
| lastActionAt | Date | |
| resolvedAt | Date | |
| resolutionReason | String | |
| createdAt, updatedAt | Date | Mongoose timestamps |

**Invariant enforced by pre-save hook:** `recoveredAmount <= amountAtRisk`

---

### 4. RecoveryAction

A single attempted action within a recovery case.

| Field | Type | Notes |
|---|---|---|
| caseId | ObjectId | Ref: RecoveryCase |
| actionType | Enum | RETRY_PAYMENT / CREATE_PAYMENT_LINK / SEND_REMINDER / ESCALATE / STOP_WORKFLOW / VERIFY_PAYMENT |
| actorType | Enum | SYSTEM / AI_AGENT / HUMAN / WEBHOOK |
| reason | String | Why this action was taken |
| status | Enum | PENDING / EXECUTING / SUCCESS / FAILED / SKIPPED / CANCELLED |
| attemptNumber | Number | Sequential attempt count |
| amountTargeted | Number | In paise |
| amountRecovered | Number | In paise. Filled after verification. |
| providerReference | String | External reference (never credentials) |
| errorCode | String | |
| errorMessage | String | |
| metadata | Mixed | Extra context. **Must never contain secrets.** |
| startedAt, completedAt | Date | |
| createdAt, updatedAt | Date | Mongoose timestamps |

---

### 5. RecoveryPolicy

The **guardrail layer**. The AI recommendation must always pass through this policy before any action executes.

| Field | Default | Notes |
|---|---|---|
| name | — | Unique policy name |
| maxRetries | 3 | Max payment retry attempts per case |
| retryIntervalMinutes | 360 | Min time between retries (6h) |
| maxReminders | 2 | Max reminder messages per case |
| recoveryWindowHours | 168 | Total window (7 days) |
| maxEscalationLevel | 2 | Max escalation steps |
| stopOnSuccess | true | Immediately stop on payment success |
| stopOnCustomerOptOut | true | Immediately stop if customer opts out |
| enabled | true | Whether this policy is active |

> **Architecture rule:** AI Decision → Policy Validation → Permission Check → Action Executor. The AI must never bypass this layer.

---

### 6. AuditLog

**Append-only** record of every significant event in the recovery workflow.

| Field | Type | Notes |
|---|---|---|
| caseId | ObjectId | Ref: RecoveryCase |
| eventType | Enum | CASE_CREATED / AI_ANALYSIS_STARTED / AI_ANALYSIS_COMPLETED / ACTION_RECOMMENDED / POLICY_CHECKED / ACTION_STARTED / ACTION_COMPLETED / ACTION_FAILED / PAYMENT_SUCCEEDED / PAYMENT_FAILED / RECOVERY_COMPLETED / RECOVERY_STOPPED / ESCALATED / CASE_EXPIRED / CASE_CLOSED / WEBHOOK_RECEIVED |
| actorType | Enum | SYSTEM / AI_AGENT / HUMAN / WEBHOOK |
| message | String | Human-readable description |
| reason | String | Why this event occurred |
| previousState | String | State snapshot before event |
| newState | String | State snapshot after event |
| metadata | Mixed | Extra context. **Never store secrets here.** |
| timestamp | Date | Event time (indexed) |

> Audit logs must never be deleted or modified by the application.

---

## Relationships

```
Customer
  └── Payments (1:many via customerId)
  └── RecoveryCases (1:many via customerId)

Payment
  └── RecoveryCase (1:1 via paymentId, optional)

RecoveryCase
  ├── RecoveryActions (1:many via caseId)
  └── AuditLogs (1:many via caseId)

RecoveryPolicy
  └── Used by Recovery Engine (future phase)
```

---

## Money Representation

All monetary amounts use **integer paise** (INR smallest unit):

- Rs 1.00 = 100 paise
- Rs 100.50 = 10050 paise
- Rs 50,000.00 = 5,000,000 paise

Utility: `server/src/utils/money.js` — `rupeesToPaise()`, `paiseToRupeeString()`, `isValidPaise()`

---

## Recovery Case Lifecycle

```
OPEN
  └── ANALYZING          (AI analysis started)
        └── ACTION_PENDING    (recommendation ready, awaiting policy check)
              └── IN_RECOVERY      (action executing)
                    ├── RECOVERED      (payment succeeded)
                    ├── ESCALATED      (max retries reached, escalated)
                    ├── EXPIRED        (recovery window elapsed)
                    └── CLOSED         (manually closed)
```

---

## Synthetic Data Rules

- All demo records must have `_isDemoData: true`
- All demo external IDs must use prefixes: `demo_pay_`, `demo_order_`, `demo_customer_`, `demo_link_`
- The seed script only deletes records where `_isDemoData: true`
- Demo diagnoses are pre-generated strings for illustration — not real AI output
- No fake Razorpay transaction IDs may claim to represent real provider data

---

## Planned Future Stopping Rules

These will be enforced by the Policy Engine in a future phase:

- Maximum retry count (enforced by `maxRetries`)
- Minimum retry interval (enforced by `retryIntervalMinutes`)
- Maximum reminders (enforced by `maxReminders`)
- Recovery window expiry (enforced by `recoveryWindowHours`)
- Customer opt-out (enforced by `stopOnCustomerOptOut`)
- Successful payment immediately stops recovery (`stopOnSuccess`)
- Already-recovered cases cannot be recovered again
- Maximum escalation level (`maxEscalationLevel`)
- Duplicate webhook events must be safely ignored (future idempotency layer)
