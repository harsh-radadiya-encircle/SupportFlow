# 💳 SupportFlow — Subscription & Billing Guide

## Overview

SupportFlow uses **Razorpay** as the payment gateway for subscription billing. All payment verification and plan enforcement is handled server-side.

---

## 📦 Plan Tiers

| Feature | FREE | STANDARD | BUSINESS |
|---------|------|----------|----------|
| **Price (Monthly)** | ₹0 | ₹2,499/mo | ₹6,499/mo |
| **Price (Yearly)** | ₹0 | ₹24,990/yr | ₹64,990/yr |
| **Support Agents** | 1 | 5 | 20 |
| **Tickets/Month** | 25 | Unlimited | Unlimited |
| **Real-Time Chat** | ✅ | ✅ | ✅ |
| **Push Notifications** | ✅ | ✅ | ✅ |
| **Analytics Dashboard** | Basic | Full | Full |

---

## 🔄 Payment Flow

### Upgrade Flow

```
1. Business Admin clicks "Upgrade" in frontend
2. Client calls POST /api/v1/subscriptions/razorpay-order
   Body: { plan: "STANDARD", billingCycle: "monthly" }

3. Backend creates Razorpay order via SDK
   Returns: { orderId, amount, currency, key }

4. Client opens Razorpay Checkout Modal with order details

5. Customer completes payment in Razorpay modal

6. Razorpay returns: { razorpay_order_id, razorpay_payment_id, razorpay_signature }

7. Client calls POST /api/v1/subscriptions/verify-payment
   Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, billingCycle }

8. Backend verifies HMAC-SHA256 signature:
   const body = razorpay_order_id + "|" + razorpay_payment_id
   const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body).digest('hex')
   if (expected !== razorpay_signature) → reject 400

9. If valid: Update business subscription in PostgreSQL
   - plan: "STANDARD"
   - billingCycle: "monthly"
   - status: "ACTIVE"
   - currentPeriodStart: now
   - currentPeriodEnd: now + 30 days

10. Return success to client → show success UI
```

---

### Webhook Flow (Razorpay → Backend)

```
Razorpay servers → POST /api/v1/subscriptions/webhook

Headers:
  X-Razorpay-Signature: <hmac-signature>
  Content-Type: application/json (raw body)

Supported Events:
  - payment.captured       → Activate subscription
  - subscription.charged   → Renew subscription
  - subscription.cancelled → Mark subscription as cancelled
  - payment.failed         → Handle failed payment

Backend verification:
  const signature = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
                         .update(rawBody)
                         .digest('hex')
  if (signature !== req.headers['x-razorpay-signature']) → 400
```

---

### Cancellation Flow

```
1. Business Admin clicks "Cancel Subscription"
2. Client calls POST /api/v1/subscriptions/cancel
3. Backend marks subscription for cancellation at period end
4. Business retains current plan features until currentPeriodEnd
5. On period end (cron job): downgrade to FREE
```

---

### Downgrade Flow

```
1. Business Admin clicks "Downgrade to Standard/Free"
2. Client calls POST /api/v1/subscriptions/downgrade
   Body: { targetPlan: "FREE" }
3. Backend records pendingDowngrade in DB
4. On period end: downgrade executed automatically
```

---

## 🏗️ Database Schema (Subscription-Related)

```prisma
model Subscription {
  id                String           @id @default(cuid())
  businessId        String           @unique
  plan              SubscriptionPlan @default(FREE)  // FREE | STANDARD | BUSINESS
  billingCycle      BillingCycle?    // monthly | yearly
  status            SubStatus        @default(ACTIVE) // ACTIVE | PAST_DUE | CANCELLED | EXPIRED
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean          @default(false)
  pendingDowngrade   SubscriptionPlan?
  razorpayOrderId    String?
  razorpayPaymentId  String?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
}
```

---

## 🔐 Plan Enforcement

Plan limits are enforced **server-side** in the service layer before operations:

| Operation | Enforcement |
|-----------|-------------|
| Invite Agent | Check `agentsUsed < planConfig.agents` |
| Create Ticket | Check `monthlyTickets < planConfig.tickets` |
| Access Dashboard Analytics | Blocked on FREE plan |

---

## 🧾 Invoice Number Format

Invoices are generated with the format: **`SF-YYYYMM-XXXX`**

Example: `SF-202601-0042`

---

## ⚙️ Environment Variables Required

```bash
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=whsec_...
RAZORPAY_STANDARD_PLAN_ID=plan_standard
RAZORPAY_BUSINESS_PLAN_ID=plan_business
```
