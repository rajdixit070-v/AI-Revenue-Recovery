# RecoverAI — AI Revenue Recovery Agent

> Detect revenue at risk. Diagnose the problem. Recover it safely. Record everything.

---

## Problem Being Solved

Payment failures, checkout abandonments, and subscription lapses silently drain revenue.
RecoverAI automatically detects these events, diagnoses root causes, and executes safe,
policy-bounded recovery actions — with a complete audit trail of every decision.

---

## Architecture & Workflow

```
Payment Event / Webhook
        │
   Risk Detection (0–100 Score)
        │
   AI Decision Engine (Gemini 2.5 Flash / Simulation Abstraction)
        │
   Policy Validation Engine (Authoritative Guardrails)
        │
   Recovery Orchestrator
        │
   Action Executor (Razorpay Test Mode / Simulation Boundary)
        │
   Result Verification & Webhook HMAC SHA256 Signature Check
        │
   Immutable Audit Trail (Append-Only)
```

**The AI must never directly call payment provider APIs.**

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS v4, Lucide Icons |
| Backend | Node.js >= 20, Express 4 |
| Database | MongoDB, Mongoose 8 |
| AI Integration | Google Gemini REST API (`AI_MODE=gemini`) / Deterministic Simulation (`AI_MODE=simulation`) |
| Payment Gateway | Razorpay Test Mode SDK & Webhooks |

---

## Running the 100-Case Evaluation Demo (Phase 7)

RecoverAI includes a **Batch Recovery Evaluation Engine** to benchmark measured money recovered across 100+ cases.

### Method 1: Via Web UI
1. Start backend and client (`npm run dev`).
2. Open the dashboard at `http://localhost:5173`.
3. Navigate to **Batch Evaluations** (`/evaluations`) in the sidebar.
4. Click **Run Demo Evaluation (100 Cases)**.
5. Confirm the simulation benchmark.
6. View live progress and complete evaluation metrics (Total Amount at Risk, Simulated Recovered Revenue, Revenue Recovery Rate %, Policy Block Rate %, AI vs Fallback metrics).

### Method 2: Via API
```bash
# Create evaluation batch
curl -X POST http://localhost:5000/api/evaluations/batches \
  -H "Content-Type: application/json" \
  -d '{"name": "100-Case Benchmark Evaluation", "mode": "SIMULATION", "caseLimit": 100}'

# Run batch evaluation
curl -X POST http://localhost:5000/api/evaluations/batches/BATCH-1787298580488/run
```

---

## Project Structure

```
AI-Revenue-Recovery/
├── client/               React + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/   MetricCard, StatusBadge, RiskBadge, AIDecisionCard, PolicyDecisionCard, ConfirmDialog, Timeline
│   │   ├── pages/        Overview, RecoveryCases, CaseDetail, AtRisk, Evaluations, BatchReport, AgentRunConsole, Payments, Customers, AIDecisions, Policies, Audit, Settings
│   │   ├── layouts/      MainLayout, Sidebar, Topbar
│   │   ├── services/     api.js
│   │   └── utils/        money.js
│   └── index.html
├── server/               Express backend
│   ├── src/
│   │   ├── models/       Customer, Payment, RecoveryCase, RecoveryAction, RecoveryPolicy, AuditLog, WebhookEvent, BatchEvaluation, BatchCaseResult
│   │   ├── routes/       health, customers, payments, recovery, auditLogs, webhooks, evaluations
│   │   ├── services/     riskScoring, recoveryDiagnosis, aiDecisionService, policyEngine, stateMachine, actionExecutor, auditService, recoveryOrchestrator, razorpayService, simulationProvider, syntheticDataset, batchRecoveryService
│   │   └── utils/        money.js
│   └── tests/            riskScoring, diagnosis, policyEngine, stateMachine, fallbackDecisionEngine, razorpayService, actionExecutor, webhooks, aiPromptBuilder, aiResponseParser, aiDecisionService, batchRecoveryService
├── docs/                 architecture.md, data-model.md, recovery-engine.md, razorpay-integration.md, ai-decision-engine.md, batch-evaluation.md
├── package.json          npm workspaces root
└── README.md
```

---

## Local Development

### Install dependencies

```bash
# Install root, server, and client dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Run tests

```bash
cd server
npm test
```

### Start application

```bash
npm run dev
# Starts Express server at http://localhost:5000
# Starts Vite client at http://localhost:5173
```
