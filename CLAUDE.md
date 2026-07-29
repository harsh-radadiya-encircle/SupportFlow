# CLAUDE.md / SUPPORTFLOW.md

> **AI Assistant Decision Framework & Operational Guidelines for SupportFlow**

All AI assistants working on **SupportFlow** must resolve decisions against `PROJECT_CONTEXT.md` and adhere strictly to the engineering rules below.

---

## 1. Decision Framework

Before choosing any package, pattern, file location, or algorithm, answer these questions:

1. **Does a pattern already exist in the codebase?**
   - *Check*: Look in `backend/src/modules/` or `frontend/src/features/` or `frontend/src/shared/`. Never re-invent utilities that already exist (e.g. `apiClient.ts`, `cn.ts`, `Button.tsx`, `ApiError.ts`, `prisma.ts`).

2. **Is it TypeScript-only?**
   - *Rule*: JavaScript (`.js`/`.jsx`) is prohibited in application code. Use TypeScript (`.ts`/`.tsx`) with strict types only. No `any` types unless strictly necessary for external raw payloads.

3. **Where should a new file live?**
   - *Backend*: Domain logic goes into `backend/src/modules/<module-name>/` (`.service.ts`, `.controller.ts`, `.routes.ts`). Shared middlewares go into `backend/src/middleware/`.
   - *Frontend*: Reusable global core goes into `frontend/src/shared/` (`api/`, `components/ui/`, `layouts/`, `store/`, `types/`, `lib/`). Feature-specific code goes into `frontend/src/features/<feature-name>/` (`api/`, `components/`, `pages/`, `index.ts`).

4. **Is state managed correctly?**
   - *UI & Session State*: Use Zustand (`useAuthStore`).
   - *Server & API Caching*: Use TanStack Query (`useQuery`, `useMutation`). Do NOT store API response arrays unnecessarily in Zustand.

5. **Is security backend-enforced?**
   - *Rule*: Never rely only on frontend role checks. Every protected backend endpoint must apply `authenticate` and `authorize([ROLES...])`.

---

## 2. Mandatory Stack Rules

- **Language**: TypeScript 5+ (Strict Mode).
- **Backend Framework**: Node.js + Express.js + Prisma ORM + PostgreSQL.
- **Frontend Framework**: React 19 + TypeScript + Vite + Tailwind CSS + Glassmorphism / Light Mode HSL design system.
- **Real-Time Engine**: Socket.IO (`ticket:${ticketId}` rooms).
- **Form Validation**: React Hook Form + Zod.
- **Auth Verification**: Firebase Admin SDK + JWT token verification.
- **Billing & Subscriptions**: Stripe SDK (Checkout, Webhook verification with `express.raw()`).
- **Security**: `express-rate-limit` rate limiting + `helmet` security headers.

---

## 3. Standard Commands

### Backend Commands (`/backend`)
- `npm run dev`: Start Express development server with `ts-node-dev`.
- `npm run build`: Compile TypeScript to `/dist` (`npx tsc`).
- `npx tsc --noEmit`: Perform static type check without emitting files.
- `npx prisma generate`: Regenerate Prisma client types.
- `npx prisma migrate dev`: Run PostgreSQL database migrations.
- `npm run prisma:seed`: Seed default database roles and test users.

### Frontend Commands (`/frontend`)
- `npm run dev`: Start Vite development web server (`http://localhost:5173`).
- `npm run build`: Build production bundle (`npx tsc -b && vite build`).
- `npx tsc -b`: Check TypeScript compilation cleanly across app and node targets.

## 5. Mandatory Engineering Standards (18 Pillars)

All developers and AI assistants working on SupportFlow MUST ALWAYS follow these 18 Engineering Standards:

1. **TypeScript Only**: JavaScript is prohibited. Use TypeScript strictly.
2. **Prisma ORM Only**: All PostgreSQL operations must use Prisma ORM singleton.
3. **Zustand for Client State**: Use Zustand for UI/session state.
4. **No Redux**: Redux is strictly forbidden.
5. **TanStack Query for API Caching**: Use TanStack Query for API server state and caching.
6. **No API Response Bloat in Zustand**: Do NOT store API response arrays unnecessarily in Zustand.
7. **Form Validation**: Use React Hook Form + Zod for all form validation.
8. **Backend Firebase Token Verification**: Verify Firebase ID Tokens on the backend using `authenticate` middleware.
9. **No Client-Only Security**: Always enforce backend role authorization using `authorize` middleware.
10. **Socket.IO Rooms**: Use Socket.IO rooms (`ticket:${ticketId}`) for ticket conversations.
11. **Persistent Data**: Store all important messages and push notifications in PostgreSQL.
12. **Stripe Signature Verification**: Verify Stripe webhooks using `express.raw()` and `stripe.webhooks.constructEvent()`.
13. **Backend Subscription Control**: Plan limits and features must be enforced by the backend.
14. **Pagination**: Every list must support pagination or limited query results.
15. **Form Error Handling**: Every form must include client & server error handling.
16. **UI States**: Every feature view must handle Loading, Empty, and Error UI states.
17. **Environment Variables**: Store all credentials and secret keys in `.env`.
18. **Review & Test**: AI-generated code must be reviewed, understood, and tested manually.

---

## 6. Code Quality Standards & Engineering Mandates

1. **ESLint & Prettier**: Automated linting and formatting on every edit (`.prettierrc`).
2. **Husky & lint-staged**: Pre-commit validation enforcing clean types and formatting before git commits.
3. **Feature-Based Folder Structure**: Domain modules in `features/` and centralized core in `shared/`.
4. **Reusable UI Components**: Primitives in `shared/components/ui/` (`Button`, `Input`, `Card`, `Badge`).
5. **Centralized API Services**: Axios base client in `shared/api/apiClient.ts` with feature API services.
6. **Centralized Error Handling**: Backend throws `ApiError` instances caught by Express `errorHandler` middleware.
7. **Consistent Naming Standards**: `PascalCase` for Components/Types, `camelCase` for functions/vars, `UPPER_CASE` for Enums/Constants.

---

## 7. References & Documentation Files

- [PROJECT_CONTEXT.md](file:///d:/SupportFlow/PROJECT_CONTEXT.md): Single source of truth for business goals, roles, schema, and modules.
- [.agents/skills/nodejs-backend/SKILL.md](file:///d:/SupportFlow/.agents/skills/nodejs-backend/SKILL.md): Backend standards, error handling, rate limiting, and Prisma patterns.
- [.agents/skills/reactjs-frontend/SKILL.md](file:///d:/SupportFlow/.agents/skills/reactjs-frontend/SKILL.md): Frontend component, layout, theme, and Zustand/TanStack Query patterns.
- [docs/compliance-matrix.md](file:///d:/SupportFlow/docs/compliance-matrix.md): Multi-tenant isolation and security compliance.
- [docs/dev-checklist.md](file:///d:/SupportFlow/docs/dev-checklist.md): Daily 1-page development checklist.

