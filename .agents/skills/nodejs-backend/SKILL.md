---
name: nodejs-backend
description: Node.js, Express, Prisma ORM, Socket.IO, and Stripe backend engineering standards for SupportFlow
---

# Node.js & Express Backend Engineering Skill

> **Code-Level Standards & Non-Negotiable Patterns for SupportFlow Backend Service**

---

## 1. Non-Negotiables

1. **TypeScript Only**: No `.js` files in application logic.
2. **Prisma ORM Only**: Direct SQL or alternative ORMs are prohibited.
3. **Backend Access Control**: Every non-public endpoint MUST pass:
   - `authenticate` (Verifies Firebase ID token or JWT fallback + populates `req.user`).
   - `authorize(['ROLE_1', 'ROLE_2'])` (Role authorization guard).
4. **Multi-Tenant Isolation**: Queries MUST include `businessId` filtering whenever querying tickets, users, invitations, or activity logs for a business context.
5. **Stripe Webhook Protection**: Stripe webhook endpoint MUST use `express.raw({ type: 'application/json' })` and `stripe.webhooks.constructEvent()` for signature verification.
6. **Centralized Error Handling**: Throw `ApiError` instances (`ApiError.badRequest`, `unauthorized`, `forbidden`, `notFound`, `internal`) and let `errorHandler` catch them. Do not send ad-hoc `res.status(500)` in controllers.

---

## 2. Standard Module Structure

Every backend module in `src/modules/<module-name>/` follows this tri-file structure:

```
src/modules/<module-name>/
├── <module-name>.service.ts     # Business logic & Prisma ORM database operations
├── <module-name>.controller.ts  # HTTP Request/Response handling & calling service methods
└── <module-name>.routes.ts      # Route definitions, rate limiters, auth middlewares
```

### Example Route Definition Pattern (`tickets.routes.ts`):
```typescript
import { Router } from 'express';
import { TicketsController } from './tickets.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createTicketSchema } from './tickets.schema';

const router = Router();

router.use(authenticate); // Require authentication for all ticket endpoints

router.get('/', authorize(['BUSINESS_ADMIN', 'SUPPORT_AGENT', 'CUSTOMER']), TicketsController.getTickets);
router.post('/', authorize(['CUSTOMER']), validate(createTicketSchema), TicketsController.createTicket);
router.get('/:id', TicketsController.getTicketById);

export default router;
```

---

## 3. Real-Time Socket.IO Guidelines

- **Rooms**: Socket rooms strictly scoped by ticket ID: `ticket:${ticketId}`.
- **Events**:
  - `join_ticket`: Join room `ticket:${ticketId}`.
  - `leave_ticket`: Leave room `ticket:${ticketId}`.
  - `send_message`: Emit message to room `ticket:${ticketId}`.
  - `typing_start` / `typing_stop`: Broadcast typing status to socket peers in room.
- **Internal Notes**: Never broadcast agent internal notes over public socket rooms. Notes are persisted in DB and served only to authenticated agent/admin REST endpoints.

---

## 4. Common Mistakes to Avoid

❌ **Storing passwords in plain text**: Always use Bcrypt or Firebase Auth.
❌ **Ignoring Rate Limits**: Protect all Auth endpoints with `authRateLimiter`.
❌ **Catching Errors Silently**: Always pass caught errors to `next(error)`.
❌ **Hardcoding Secret Keys**: Always read from `env.ts`.
