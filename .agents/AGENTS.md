# SupportFlow Agent Instructions & Rules

> **Antigravity Customization Rules for SupportFlow Workspace**

---

## Workspace Knowledge & Single Source of Truth

Antigravity agents working on this workspace MUST adhere to the project standards defined in:

1. **Master Context**: [PROJECT_CONTEXT.md](file:///d:/SupportFlow/PROJECT_CONTEXT.md)
2. **Decision Framework**: [CLAUDE.md](file:///d:/SupportFlow/CLAUDE.md)
3. **Backend Engineering Skill**: [.agents/skills/nodejs-backend/SKILL.md](file:///d:/SupportFlow/.agents/skills/nodejs-backend/SKILL.md)
4. **Frontend Engineering Skill**: [.agents/skills/reactjs-frontend/SKILL.md](file:///d:/SupportFlow/.agents/skills/reactjs-frontend/SKILL.md)
5. **Security & Compliance**: [docs/compliance-matrix.md](file:///d:/SupportFlow/docs/compliance-matrix.md)

---

## Core Non-Negotiables

- **TypeScript Only**: JavaScript (`.js`/`.jsx`) is prohibited in application logic.
- **Prisma ORM Only**: All PostgreSQL operations MUST use Prisma Client singleton (`backend/src/utils/prisma.ts`).
- **State Separation**: Use Zustand for UI/session state and TanStack Query for server caching.
- **Backend Security**: All protected endpoints MUST apply `authenticate` and `authorize([ROLES...])` middlewares.
- **Feature Structure**: Frontend code MUST live in `src/shared/` or `src/features/<feature_name>/`.
