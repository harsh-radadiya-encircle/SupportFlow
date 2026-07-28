# ADR-0001: Two-Folder Monorepo Architecture & Feature-Driven Modular Frontend

- **Status**: Accepted
- **Date**: 2026-07-28
- **Authors**: SupportFlow Core Engineering Team

---

## Context

SupportFlow is a multi-tenant real-time customer support platform serving 4 distinct user roles (`PLATFORM_ADMIN`, `BUSINESS_ADMIN`, `SUPPORT_AGENT`, `CUSTOMER`). The application requires real-time Socket.IO chat, Firebase Auth, PostgreSQL data modeling with Prisma, and Stripe billing.

We needed an architectural layout that preserves clean separation of concerns, guarantees type safety, enforces backend role security, and prevents code bloat.

---

## Decision

We decided to adopt a **Two-Folder Monorepo Structure** with a **Feature-Driven Modular Frontend**:

1. **Root Directory**: `SupportFlow/`
   - `PROJECT_CONTEXT.md`: Single source of truth for business goals, roles, database models, and modules.
   - `CLAUDE.md`: AI assistant decision framework and operational guidelines.
   - `.agents/skills/`: Custom skill specifications for Node.js backend and React frontend standards.
   - `docs/`: Compliance matrix, dev checklists, ER diagrams, setup guides, and ADRs.

2. **Backend Directory (`/backend`)**:
   - Built with Node.js + Express.js + TypeScript + Prisma ORM + Socket.IO + Stripe.
   - Uses domain-driven modules (`auth`, `business`, `tickets`, `chat`, `notifications`, `subscriptions`, `dashboard`).
   - Hardened with `helmet` security headers and `express-rate-limit` rate limiting.

3. **Frontend Directory (`/frontend`)**:
   - Built with React 19 + TypeScript + Vite + Tailwind CSS + Zustand + TanStack Query.
   - Divided into `src/shared/` (Centralized shared core) and `src/features/` (Self-contained domain feature modules: `auth`, `dashboard`, `tickets`).
   - Uses path mapping aliases (`@shared/*` and `@features/*`).

---

## Consequences

### Positive
- **High Cohesion & Low Coupling**: Domain logic lives inside dedicated feature folders (`features/tickets`, `modules/tickets`).
- **Complete Type Safety**: TypeScript compiles cleanly across frontend and backend targets (`npx tsc -b` & `npx tsc --noEmit`).
- **Seamless Context Preservation**: AI assistants and developers immediately understand the exact architecture, roles, and guidelines from `PROJECT_CONTEXT.md` and `CLAUDE.md`.

### Negative / Trade-offs
- Developers must maintain path aliases `@shared/*` and `@features/*` in imports.
- Requires running dual development processes (`npm run dev` in both `/backend` and `/frontend`).
