# SupportFlow Agent Instructions & Rules

> **Antigravity Customization Rules & Non-Negotiable Engineering Standards for SupportFlow Workspace**

---

## Workspace Knowledge & Single Source of Truth

Antigravity agents working on this workspace MUST adhere to the project standards defined in:

1. **Master Context**: [PROJECT_CONTEXT.md](file:///d:/SupportFlow/PROJECT_CONTEXT.md)
2. **Decision Framework**: [CLAUDE.md](file:///d:/SupportFlow/CLAUDE.md)
3. **Backend Engineering Skill**: [.agents/skills/nodejs-backend/SKILL.md](file:///d:/SupportFlow/.agents/skills/nodejs-backend/SKILL.md)
4. **Frontend Engineering Skill**: [.agents/skills/reactjs-frontend/SKILL.md](file:///d:/SupportFlow/.agents/skills/reactjs-frontend/SKILL.md)
5. **Security & Compliance**: [docs/compliance-matrix.md](file:///d:/SupportFlow/docs/compliance-matrix.md)

---

## Mandatory Engineering Standards (18 Non-Negotiables)

1. **TypeScript Only**: JavaScript (`.js`/`.jsx`) is strictly prohibited. Use TypeScript (`.ts`/`.tsx`) with strict typing.
2. **Prisma ORM Only**: Use Prisma ORM singleton (`backend/src/utils/prisma.ts`) for all PostgreSQL operations.
3. **Zustand for Client State**: Use Zustand (`authStore.ts`) for UI and session state.
4. **No Redux**: Redux is strictly forbidden.
5. **TanStack Query for API Caching**: Use TanStack Query (`useQuery`/`useMutation`) for API state and server caching.
6. **No Stale API Data in Zustand**: Do NOT store API response array data unnecessarily in Zustand.
7. **Form Validation with Zod**: Use React Hook Form with Zod schemas for all forms.
8. **Backend Firebase Token Verification**: Verify Firebase ID tokens on the backend using Firebase Admin SDK (`authenticate` middleware).
9. **No Frontend-Only Role Checks**: Always enforce backend role authorization (`authorize` middleware).
10. **Socket.IO Ticket Rooms**: Use Socket.IO rooms (`ticket:${ticketId}`) for ticket real-time chat.
11. **Persistent Messages & Notifications**: Store all important messages and push notifications in PostgreSQL.
12. **Stripe Webhook Verification**: Verify Stripe webhook signatures using `express.raw()` and `stripe.webhooks.constructEvent()`.
13. **Backend-Controlled Subscriptions**: Subscription plan features and limits MUST be enforced by the backend.
14. **Pagination / Limits**: Every data list MUST support pagination or limited query results.
15. **Form Validation & Error Handling**: Every form MUST include client & server error handling.
16. **UI States Required**: Every feature component MUST include Loading, Empty, and Error UI states.
17. **Environment Variables Only**: Store all secrets, credentials, and API keys in environment variables (`.env`).
18. **Code Review & Quality**: AI-generated code MUST be reviewed, understood, and tested manually.

---

## Code Structure & Naming Mandates

- **Feature-Based Folder Structure**: Frontend code MUST live in `src/shared/` or `src/features/<feature_name>/`.
- **Reusable Components**: Use atomic UI primitives in `src/shared/components/ui/` (`Button`, `Input`, `Card`, `Badge`).
- **Centralized API Services**: Use `shared/api/apiClient.ts` and feature API modules (`auth.api.ts`, `tickets.api.ts`, `dashboard.api.ts`).
- **Consistent Naming**:
  - `PascalCase` for Components, Interfaces, Types, Classes, Prisma Models.
  - `camelCase` for functions, variables, methods, API services.
  - `UPPER_CASE` for Enums, Constants, Environment variables.
