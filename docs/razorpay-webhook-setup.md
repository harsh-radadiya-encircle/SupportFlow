# 💳 SupportFlow — Razorpay Webhook Setup Guide

> **Note:** SupportFlow uses **Razorpay** (not Stripe) as its payment gateway. This guide covers setting up Razorpay webhooks for production payment event handling.

---

## Overview

Razorpay webhooks are HTTP `POST` requests that Razorpay sends to your server when payment events occur. SupportFlow uses webhooks to:

- Activate subscriptions after `payment.captured`
- Record failed payments on `payment.failed`
- Handle subscription cancellation on `subscription.cancelled` / `subscription.halted`

All webhook payloads are verified using **HMAC-SHA256 signatures** before processing.

---

## 🔐 How Signature Verification Works

Razorpay sends a `X-Razorpay-Signature` header with every webhook. The backend verifies it like this:

```typescript
// backend/src/modules/subscriptions/subscriptions.service.ts
const expectedSignature = crypto
  .createHmac('sha256', env.RAZORPAY.WEBHOOK_SECRET)
  .update(payloadBuffer)   // raw Buffer body
  .digest('hex');

if (expectedSignature !== signature) {
  throw ApiError.badRequest('Razorpay Webhook signature verification failed.');
}
```

> ⚠️ The webhook endpoint receives a **raw Buffer** body (not JSON-parsed). This is why `express.raw({ type: 'application/json' })` is applied specifically to the webhook route in `app.ts`.

---

## 📋 Prerequisites

- A [Razorpay account](https://razorpay.com)
- Your backend deployed and publicly accessible (or using ngrok for local dev)
- Razorpay API keys from the Razorpay Dashboard

---

## 🛠️ Step 1 — Get Razorpay API Keys

1. Log in to [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Go to **Settings → API Keys**
3. Click **"Generate Test Key"** for development
4. Copy both the **Key ID** and **Key Secret**

```bash
# backend/.env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_key_secret_here
```

> For production: Go to **Settings → API Keys** → Switch to **Live mode** → Generate Live Keys.
> Use `rzp_live_...` prefix.

---

## 🌐 Step 2 — Expose Local Backend for Testing (Development)

Razorpay needs to reach your local server. Use **ngrok**:

```bash
# Install ngrok
npm install -g ngrok

# Expose local port 5000
ngrok http 5000
```

ngrok will give you a URL like:
```
https://abc123.ngrok-free.app
```

Your webhook endpoint will be:
```
https://abc123.ngrok-free.app/api/v1/subscriptions/webhook
```

---

## 🔗 Step 3 — Register Webhook in Razorpay Dashboard

1. In the Razorpay Dashboard → **Settings → Webhooks**
2. Click **"Add New Webhook"**
3. Fill in the form:

| Field | Value |
|-------|-------|
| **Webhook URL** | `https://api.yourdomain.com/api/v1/subscriptions/webhook` |
| **Secret** | Generate a strong random string (min 32 chars) |
| **Alert Email** | Your email for webhook failure alerts |

4. Select the following **Active Events**:

| Event | Description |
|-------|-------------|
| ✅ `order.paid` | Order payment completed |
| ✅ `payment.captured` | Payment successfully captured |
| ✅ `payment.failed` | Payment attempt failed |
| ✅ `subscription.cancelled` | Subscription cancelled by user |
| ✅ `subscription.halted` | Subscription halted due to payment failure |

5. Click **"Create Webhook"**
6. Copy the **Webhook Secret** shown after creation

```bash
# backend/.env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

---

## 🧪 Step 4 — Test the Webhook Locally

### Using Razorpay Test Mode

In test mode, use the Razorpay Dashboard to trigger test events:

1. Go to **Settings → Webhooks** → Click your webhook
2. Click **"Send Test Event"**
3. Select `payment.captured`
4. Check your backend logs for the webhook receipt

### Using curl

```bash
# Test webhook with a mock payload (signature will fail unless you compute it correctly)
curl -X POST http://localhost:5000/api/v1/subscriptions/webhook \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: test-sig" \
  -d '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test","order_id":"order_test","amount":249900,"notes":{"businessId":"your-business-id","plan":"STANDARD","billingCycle":"monthly"}}}}}'
```

---

## 📦 Handled Webhook Events

### `order.paid` / `payment.captured`

**Triggered when:** Customer completes payment in Razorpay Checkout.

**What SupportFlow does:**
1. Validates business ID from payment `notes`
2. Updates `Business.plan`, `subscriptionStatus`, `currentPeriodEnd`
3. Creates `BillingHistory` record (idempotent — skips if payment already recorded)
4. Sends `PLAN_UPGRADED` or `PLAN_PURCHASED` notification to Business Admins

```json
{
  "event": "order.paid",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxx",
        "order_id": "order_xxx",
        "amount": 249900,
        "currency": "INR",
        "notes": {
          "businessId": "uuid-of-business",
          "plan": "STANDARD",
          "billingCycle": "monthly",
          "userEmail": "admin@business.com",
          "durationDays": "30"
        }
      }
    }
  }
}
```

---

### `payment.failed`

**Triggered when:** Payment attempt fails (card declined, timeout, etc.)

**What SupportFlow does:**
1. Creates `BillingHistory` record with `status: "failed"`
2. Sends `PLAN_PAYMENT_FAILED` notification to Business Admins

---

### `subscription.cancelled` / `subscription.halted`

**Triggered when:** Razorpay subscription is cancelled or halted due to repeated failures.

**What SupportFlow does:**
1. Sets `Business.cancelAtPeriodEnd = true`
2. Sets `Business.pendingDowngradePlan = FREE`
3. Sends `PLAN_CANCELED` notification to Business Admins

---

## ♻️ Idempotency

Every webhook event is stored in the `WebhookEvent` table keyed by Razorpay's `event.id`. If the same event arrives twice (Razorpay retries on non-2xx responses), the duplicate is silently skipped.

```prisma
model WebhookEvent {
  id          String   @id @default(uuid())
  eventId     String   @unique   // ← Razorpay event ID — prevents duplicates
  eventType   String
  businessId  String?
  payload     Json
  processedAt DateTime @default(now())
}
```

---

## 🔄 Payment Verification Flow (Client-Side Checkout)

The webhook is for **server-to-server** events. For **client-side checkout verification**, SupportFlow uses a separate HMAC check on the frontend's `verify-payment` call:

```
1. Frontend creates order:
   POST /api/v1/subscriptions/razorpay-order
   → Returns: { orderId, amount, currency, keyId }

2. Frontend opens Razorpay Checkout Modal with orderId

3. Customer completes payment
   → Razorpay SDK returns: { razorpay_order_id, razorpay_payment_id, razorpay_signature }

4. Frontend calls:
   POST /api/v1/subscriptions/verify-payment
   Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, billingCycle }

5. Backend HMAC verification:
   body = razorpay_order_id + "|" + razorpay_payment_id
   expected = HMAC-SHA256(RAZORPAY_KEY_SECRET, body)
   if expected !== razorpay_signature → reject 400

6. On success → Update subscription in DB → Return success
```

---

## 🔒 Environment Variables Summary

```bash
# backend/.env

# Test keys (development)
RAZORPAY_KEY_ID=rzp_test_RECMjyRF0o9vji
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Live keys (production) — replace test keys
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your_live_key_secret
RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret
```

```bash
# frontend/.env
VITE_RAZORPAY_KEY_ID=rzp_test_...   # or rzp_live_... in production
```

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Webhook signature verification failed` | Check that `RAZORPAY_WEBHOOK_SECRET` matches what's in Razorpay Dashboard |
| Webhook not receiving events | Ensure your URL is publicly accessible; check Razorpay Dashboard → Webhook logs |
| `Missing x-razorpay-signature header` | Confirm the request is from Razorpay, not a curl test without the header |
| Same event processed twice | Check `WebhookEvent` table — idempotency should prevent this automatically |
| Plan not updating after payment | Check `payment.notes.businessId` — must be a valid UUID from your DB |

---

## 📁 Code References

| File | Purpose |
|------|---------|
| `backend/src/config/razorpay.ts` | Razorpay SDK instance initialization |
| `backend/src/app.ts` | Raw body parser middleware for webhook route |
| `backend/src/modules/subscriptions/subscriptions.controller.ts` | Webhook HTTP handler |
| `backend/src/modules/subscriptions/subscriptions.service.ts` | `handleRazorpayWebhook()` — full event processing |
| `backend/src/modules/subscriptions/plans.config.ts` | Plan pricing, limits, and configuration |
