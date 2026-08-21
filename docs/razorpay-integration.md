# RecoverAI — Razorpay Test Mode Integration Architecture (Phase 4)

## Overview

RecoverAI integrates with **Razorpay Test Mode** to execute recovery workflows cleanly from detection to verified payment settlement.

The integration covers:
- Test Mode order creation (`createOrder`)
- Payment Link generation (`createPaymentLink`)
- Server-side signature verification (`verifyPaymentSignature`)
- Webhook raw-body signature validation (`verifyWebhookSignature` using HMAC SHA256)
- Webhook idempotency tracking (`WebhookEvent` model)
- Verified payment recovery confirmation

---

## Architecture & Data Flow

```
+------------------------+
|  Recovery Orchestrator |
+-----------+------------+
            |
            v
+------------------------+
|     Policy Engine      |  (Guardrail check — blocks unpermitted actions)
+-----------+------------+
            | (if allowed)
            v
+------------------------+
|    Action Executor     |  (server/src/services/actionExecutor.js)
+-----------+------------+
            |
            v
+------------------------+
|    Razorpay Service    |  (server/src/services/razorpayService.js)
+-----------+------------+
            | (Test Mode API Call)
            v
+------------------------+
| Razorpay Test Mode API |
+-----------+------------+
            |
            +------------+ (Customer completes Test Payment)
                         |
                         v
+-------------------------------------------------------+
| Webhook: POST /api/webhooks/razorpay                  |
| 1. Extract x-razorpay-signature                       |
| 2. HMAC SHA256 verify raw req.rawBody                 |
| 3. Check WebhookEvent idempotency                     |
| 4. Update Payment status -> SUCCESS                    |
| 5. Update RecoveryCase -> RECOVERED & amount           |
| 6. Log AuditLog event                                 |
+-------------------------------------------------------+
```

---

## Environment Configuration

In `server/.env`:

```env
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
```

> **Security Rule:** Never commit real credentials to Git. Use `server/.env.example` as a template.

---

## Webhook Verification & Security

Razorpay webhook signature verification is performed using HMAC SHA256:

$$\text{Expected Signature} = \text{HMAC-SHA256}(\text{rawBody}, \text{RAZORPAY\_WEBHOOK\_SECRET})$$

Key security safeguards:
1. Signature is verified against the unparsed raw request buffer (`req.rawBody`).
2. Comparisons use timing-safe buffer equality (`crypto.timingSafeEqual`).
3. Invalid signatures return HTTP 400 and log an audit event `RAZORPAY_WEBHOOK_REJECTED`.
4. Idempotency is enforced by recording `eventId` in the `WebhookEvent` collection.

---

## Supported Webhook Events

| Razorpay Event | Action Taken |
|---|---|
| `payment.captured` / `payment.authorized` | Sets `Payment.status = 'SUCCESS'`, updates `RecoveryCase.recoveredAmount`, sets status to `RECOVERED`, logs `RAZORPAY_PAYMENT_VERIFIED` and `PAYMENT_RECOVERY_CONFIRMED`. |
| `order.paid` / `payment_link.paid` | Confirms order settlement, marks recovery complete. |
| `payment.failed` | Sets `Payment.status = 'FAILED'`, logs failure metadata and audit log `RAZORPAY_PAYMENT_FAILED`. |

---

## Local Webhook Testing (Razorpay CLI / ngrok)

To receive webhooks during local development:

```bash
# Using ngrok to expose port 5000:
ngrok http 5000

# Configure Webhook URL in Razorpay Dashboard (Test Mode):
# https://<your-ngrok-subdomain>.ngrok-free.app/api/webhooks/razorpay
# Set Webhook Secret = YOUR_WEBHOOK_SECRET
# Enable events: payment.captured, payment.failed, order.paid, payment_link.paid
```
