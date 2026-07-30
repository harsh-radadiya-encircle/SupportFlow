# Developer Daily Decision Checklist

> **The 1-Page Guide: 5 Questions Before Starting Any Task & 4 Questions Before Adding Any Package**

---

## 5 Questions Before Starting Any Task

1. **Which User Role does this task affect?**
   - *Options*: `PLATFORM_ADMIN`, `BUSINESS_ADMIN`, `SUPPORT_AGENT`, `CUSTOMER`.
   - *Action*: Confirm RBAC rules in `backend/src/middleware/authorize.ts` and `frontend/src/shared/routes/ProtectedRoute.tsx`.

2. **Is multi-tenant isolation required for this feature?**
   - *Rule*: If querying business data, always include `businessId: req.user.businessId` in Prisma `where` clauses.

3. **Does this feature require real-time updates?**
   - *Rule*: If live messaging, typing indicators, or status changes are involved, emit events over Socket room `ticket:${ticketId}`.

4. **Where should new code live?**
   - *Backend*: `backend/src/modules/<module-name>/`.
   - *Frontend*: Reusable core in `frontend/src/shared/`, domain specific UI/API in `frontend/src/features/<feature-name>/`.

5. **Is there an existing component or helper I should reuse?**
   - *UI*: Check `shared/components/ui/` (`Button`, `Input`, `Card`, `Badge`).
   - *API/Utils*: Check `shared/api/apiClient.ts`, `shared/lib/cn.ts`, `backend/src/utils/prisma.ts`.

---

## 4 Questions Before Adding Any Package

1. **Can this be solved cleanly with existing installed packages?**
   - *Installed*: `express`, `prisma`, `firebase-admin`, `razorpay`, `socket.io`, `zod`, `express-rate-limit`, `helmet`, `react 19`, `zustand`, `tanstack query`, `axios`, `lucide-react`, `recharts`, `date-fns`.

2. **Is the package TypeScript native or supported with `@types`?**
   - *Rule*: JavaScript-only packages without TypeScript types are prohibited.

3. **Does the package introduce security risks or heavy bundle bloat?**
   - *Rule*: Evaluate bundle impact before installing.

4. **Does adding this package violate mandatory engineering standards?**
   - *Rule*: No Redux (use Zustand), no Tailwind v4 breaking syntax without confirmation, no unverified OAuth handlers.

---

## Verification Criteria Before Marking Done

- [ ] Run `npx tsc --noEmit` in `/backend` -> **0 errors**.
- [ ] Run `npx tsc -b` in `/frontend` -> **0 errors**.
- [ ] Test API endpoint via Swagger (`http://localhost:5000/api-docs`).
- [ ] Test UI interactive state in Light Mode (`http://localhost:5173`).
