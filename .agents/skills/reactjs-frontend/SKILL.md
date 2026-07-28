---
name: reactjs-frontend
description: React 19, TypeScript, Vite, Tailwind CSS, Zustand, and TanStack Query engineering standards for SupportFlow
---

# React.js Frontend Engineering Skill

> **Code-Level Standards & Architectural Guidelines for SupportFlow Frontend Application**

---

## 1. Modular Directory Blueprint

SupportFlow frontend code is organized strictly into `src/shared/` (Central Shared Core) and `src/features/` (Self-Contained Domain Features):

```
frontend/src/
├── shared/                         # Centralized Shared Utilities & UI Primitives
│   ├── api/                        # apiClient.ts (Axios with token interceptors)
│   ├── components/                 # ui/ (Button, Input, Card, Badge)
│   ├── config/                     # firebase.ts (Firebase Web SDK)
│   ├── layouts/                    # DashboardLayout.tsx
│   ├── lib/                        # cn.ts (Class merging helper)
│   ├── routes/                     # AppRoutes.tsx, ProtectedRoute.tsx
│   ├── store/                      # authStore.ts (Zustand session state)
│   └── types/                      # index.ts (Global domain TypeScript interfaces)
│
└── features/                       # Self-Contained Domain Feature Modules
    ├── auth/                       # api/, pages/ (LoginPage, ForgotPassword, ResetPassword), index.ts
    ├── business/                   # api/, components/, pages/, index.ts
    ├── dashboard/                  # api/, pages/, index.ts
    └── tickets/                    # api/, components/ (ChatBox, PrivateNotes, Timeline), pages/, index.ts
```

---

## 2. Non-Negotiable Rules

1. **Path Mapping Aliases**:
   - Use `@shared/*` for imports from `src/shared/`.
   - Use `@features/*` for imports from `src/features/`.
2. **State Management Division**:
   - **Zustand (`authStore`)**: Manages client UI state, active user session, token, and theme mode.
   - **TanStack Query (`useQuery`/`useMutation`)**: Manages server data fetching, refetching, and caching.
3. **Form Validation**: All forms MUST use `react-hook-form` paired with a `zodResolver(schema)`.
4. **Theme Design Tokens**: Use global HSL CSS variables in `index.css` (`--bg-page`, `--bg-card`, `--text-primary`, `--primary`).
5. **No Native `alert()` or `console.log()` in Production**: Use toast components or structured UI error states.

---

## 3. UI Component Standards

- **Buttons**: Use `Button` with `variant` (`primary`, `secondary`, `outline`, `ghost`, `danger`) and `isLoading` spinner state.
- **Inputs**: Use `Input` with `label`, `leftIcon`, and Zod `error` display.
- **Cards**: Use `Card` with `glass` option for frosted glass panels.
- **Badges**: Use `Badge` with semantic variants (`success`, `warning`, `danger`, `info`, `purple`).

---

## 4. Common Mistakes to Avoid

❌ **Direct Axios Calls in Components**: Place API calls in `features/<feature>/api/<feature>.api.ts`.
❌ **Hardcoding Colors**: Use Tailwind tokens (`text-slate-900`, `bg-white`, `text-indigo-600`) or HSL variables.
❌ **Unvalidated Inputs**: Always wrap forms in Zod schemas.
