# RecoverAI — Judge-Facing Hackathon Demo Script (5–7 Minutes)

## Demo Title: Autonomous B2B Revenue Recovery with Verified Policy Safety

---

### Step 1: Overview & Value Proposition (1 Minute)
- **Host Narrative:**
  > "Every month, SaaS and e-commerce merchants lose 5% to 15% of revenue due to payment declines, abandoned checkouts, and mandate lapses. Manual recovery is slow and risk-prone. Generic bots annoy customers.
  > **RecoverAI** is an autonomous AI Revenue Recovery Agent that detects revenue at risk, diagnoses root causes, generates model-driven recovery recommendations, validates actions against strict business policies, executes via Razorpay Test Mode or Simulation boundaries, and maintains a complete, append-only audit trail."

- **Screen Action:** Open dashboard (`/`). Show **Revenue at Risk**, **Recovered Revenue**, **Revenue Recovery Rate %**, and **Needs Attention Queue**.

---

### Step 2: Individual Case Deep-Dive (2 Minutes)
- **Screen Action:** Click on **At Risk Queue** (`/at-risk`), select a **HIGH** or **CRITICAL** risk case (e.g. `BATCH-CASE-005`).
- **Show Case Details (`/recovery-cases/BATCH-CASE-005`):**
  1. **Financial Impact:** Amount at risk in ₹.
  2. **AI Recommendation Card:** Displays action (`RETRY_PAYMENT` or `CREATE_PAYMENT_LINK`), confidence %, reasoning, and expected outcome.
  3. **Policy Engine Check Card:** Emphasize: *"The AI model recommends actions, but the Policy Engine remains authoritative. The AI cannot execute provider calls directly or bypass retry limits."*
  4. **Execute Action:** Click **Execute Recovery**, confirm modal. Action executes in Razorpay Test Mode / Simulation. Show state update and audit log event.

---

### Step 3: 100-Case Benchmark Evaluation (2 Minutes)
- **Screen Action:** Navigate to **Batch Evaluations** (`/evaluations`).
- **Click:** **Run Demo Evaluation (100 Cases)**.
- **Narrative:**
  > "To prove scale and resilience, RecoverAI runs a 100-case evaluation batch. Watch the Agent Run Execution Console streaming live audit events as detection, risk scoring, AI analysis, policy checks, and simulated collections occur concurrently."

- **Screen Action:** Open the resulting **Evaluation Report** (`/evaluations/BATCH-...`):
  - **Financial Metrics:** Total Amount at Risk vs Simulated Recovered Revenue.
  - **Revenue Recovery Rate:** ~65–75% benchmark.
  - **Policy Block Rate & Escalations:** Highlight that high-risk or policy-violating cases were safely escalated or blocked.
  - **Export:** Show CSV report export.

---

### Step 4: Audit & Safety Architecture (1 Minute)
- **Screen Action:** Open **Agent Run Console** (`/agent-runs`) and **Policies** (`/policies`).
- **Summary:**
  - Zero raw prompt leaks, zero hardcoded API keys.
  - Guaranteed financial integrity (paise integer accounting).
  - Complete auditable event log for compliance.
