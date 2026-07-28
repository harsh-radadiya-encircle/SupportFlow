# Compliance & Security Matrix

> **Security, Multi-Tenant Data Isolation, and Payment Compliance Standards for SupportFlow**

---

## 1. Compliance Requirements Matrix

| Region / Law | Technical Requirement | Implementation Standard in SupportFlow |
| :--- | :--- | :--- |
| **GDPR / Privacy** | Multi-Tenant Data Isolation | All queries MUST filter by `businessId` to prevent cross-tenant data leakage. |
| **PCI-DSS / Stripe** | Card Data Protection | No raw credit card data touches SupportFlow servers. Payments handled exclusively via Stripe Checkout & Webhooks. |
| **Stripe Security** | Webhook Integrity | Webhook endpoint MUST verify signatures using `stripe.webhooks.constructEvent()` with `express.raw()`. |
| **Authentication Security**| Token Integrity | Backend MUST verify Firebase ID Tokens or JWT tokens; client-side role claims are untrusted. |
| **API Defense** | Rate Limiting & Anti-DDoS | `express-rate-limit` enforces 10 auth attempts/15 mins per IP and 100 API requests/min per IP. |
| **HTTP Hardening** | Security Headers | `helmet` middleware injects HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff. |

---

## 2. Multi-Tenant Data Isolation Rules

Every PostgreSQL query executed via Prisma MUST maintain tenant boundaries:

```typescript
// ✅ CORRECT: Scoped by businessId from req.user
const tickets = await prisma.ticket.findMany({
  where: {
    businessId: req.user.businessId,
    status: statusQuery,
  },
});

// ❌ INCORRECT: Missing tenant isolation filter!
const tickets = await prisma.ticket.findMany({
  where: { status: statusQuery },
});
```

---

## 3. Stripe Webhook Verification Standard

```typescript
app.post('/api/v1/subscriptions/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE.WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Signature Error: ${err.message}`);
  }
  // Process event...
});
```
