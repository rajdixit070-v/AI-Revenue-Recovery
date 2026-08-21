# RecoverAI — Judge Q&A & Technical Defense Guide

### Q1: Why use AI instead of pure rule-based dunning?
**Answer:** Pure rule-based dunning treats all failures identically. An insufficient funds error on a high-LTV customer requires a soft, delayed retry, while a checkout abandonment requires a personalized payment link. RecoverAI uses Gemini to analyze multidimensional context (customer LTV, decline code, retry count, issue category) and recommend the optimal action, while the Policy Engine enforces strict limits.

---

### Q2: What happens if Gemini AI is unavailable or fails?
**Answer:** RecoverAI is resilient by design. If Gemini encounters an API error, rate limit, or timeout, the system automatically delegates to `fallbackDecisionEngine.js`. Fallback rules generate safe, deterministic recommendations so the recovery workflow never halts or crashes.

---

### Q3: Can the AI directly call Razorpay APIs or charge customers?
**Answer:** **No.** The AI model emits structured JSON recommendations ONLY (`action`, `confidence`, `reason`). Recommendations are passed to the Policy Engine for validation. Only the `actionExecutor.js` module possesses the authorization to invoke Razorpay Test Mode SDK APIs or simulation providers.

---

### Q4: How do you prevent AI prompt injection or hallucinated actions?
**Answer:**
1. All customer-provided strings are sanitized and wrapped inside `<UNTRUSTED_CUSTOMER_DATA>` XML tags in the prompt builder.
2. The AI response parser (`aiResponseParser.js`) validates output against a strict schema. Any unpermitted action string or out-of-bounds confidence float is immediately rejected.

---

### Q5: How are stopping rules enforced?
**Answer:** The Policy Engine enforces stopping rules server-side. Workflow stops when:
1. Provider webhook verifies payment recovery (`PAYMENT_ALREADY_RECOVERED`).
2. Maximum retries or reminder limits are reached (`MAX_RETRIES_EXCEEDED`).
3. Recovery window expires (`RECOVERY_WINDOW_EXPIRED`).
4. Customer status is set to `BLOCKED` or `OPTED_OUT`.

---

### Q6: How is Razorpay integrated?
**Answer:** RecoverAI integrates with the official `razorpay ^2.9.5` Node.js SDK for Razorpay Test Mode. It supports Order Creation (`orders.create`), Payment Link Generation (`paymentLink.create`), and HMAC SHA-256 raw-body signature verification for Razorpay webhooks (`POST /api/webhooks/razorpay`).

---

### Q7: How does financial accounting handle money?
**Answer:** All monetary figures internally use integer smallest-unit representation (paise, where ₹1 = 100 paise). The frontend cannot directly mutate financial figures; all metrics are derived dynamically from MongoDB aggregations over verified provider or simulation records.

---

### Q8: How does the 100-case evaluation work?
**Answer:** The Batch Evaluation Engine (`batchRecoveryService.js`) processes 100 synthetic recovery cases with controlled concurrency (max 5 cases). It evaluates each case through the complete orchestrator pipeline, applying deterministic simulation outcomes without `Math.random()`, yielding reproducible recovery rates and policy block rates.
