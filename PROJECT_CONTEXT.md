# PROJECT_CONTEXT.md

> **Mandatory Project Context & Single Source of Truth for SupportFlow**

---

## 1. Executive Summary & Business Goal

**SupportFlow** is a lightweight, multi-tenant customer support platform built for small businesses transitioning away from fragmented customer communication (WhatsApp, email, phone calls).

### Core Problem Solved
Small businesses struggle to assign tickets, track agent response times, monitor unresolved issues, or evaluate support team performance due to disconnected channels.

### Core Business Solution
A single, unified real-time support platform where:
- Customers register, log in, create tickets, send live messages, and track status.
- Support agents view assigned queues, reply in real time, add private internal notes, and update statuses.
- Business admins manage business profiles, invite agents, track team metrics, and manage Stripe subscriptions.
- Platform admins manage registered businesses, monitor subscription plans, and toggle business suspensions.

---

## 2. Target Audience, Compliance & Budget

- **Target Audience**: Small businesses, SMB support teams, e-commerce vendors, SaaS startups.
- **Geography / Region**: Global (Multi-tenant SaaS architecture).
- **Compliance & Security Requirements**:
  - GDPR & Data Privacy: Multi-tenant data isolation strictly enforced via `businessId` in PostgreSQL queries.
  - Stripe Security: Webhook signature verification mandatory (`express.raw({ type: 'application/json' })`).
  - Auth Security: Backend verification of Firebase ID Tokens; client-only role checks prohibited.
- **Budget & Scale Tier**: Lightweight SMB scale (1 to 20 support agents per business; up to thousands of tickets).

---

## 3. Technology Stack Specification

| Tier | Component | Technology Selection |
| :--- | :--- | :--- |
| **Frontend Core** | Framework | React 19 + TypeScript (Vite bundler) |
| **Frontend UI** | Styling & System | Tailwind CSS + Glassmorphism Tokens + Light Mode HSL design system |
| **Frontend State**| Client State | Zustand (UI/Session state) |
| **Frontend Cache**| API Caching | TanStack Query v5 (Server API state & caching) |
| **Frontend Forms**| Validation | React Hook Form + Zod schemas |
| **Frontend Comms**| Real-Time & Network| Socket.IO Client + Axios with Interceptors |
| **Frontend Auth** | SDK | Firebase SDK (Email/Password & Google OAuth) |
| **Frontend Charts**| Analytics | Recharts |
| **Backend Core** | Runtime & Server | Node.js + Express.js + TypeScript |
| **Backend DB** | Database & ORM | PostgreSQL + Prisma ORM |
| **Backend Comms**| Real-Time Engine | Socket.IO Server (Ticket rooms: `ticket:${ticketId}`) |
| **Backend Auth** | Verification | Firebase Admin SDK + JWT Fallback |
| **Backend Pay** | Subscriptions | Stripe Node SDK (Checkout, Webhooks, Billing Portal) |
| **Backend Sec** | Security & Limits | Helmet security headers + `express-rate-limit` rate limiting |
| **Documentation**| OpenAPI & Docs | Swagger UI Express (`http://localhost:5000/api-docs`) + Mermaid ER Diagrams |

---

## 4. User Roles & Access Control Matrix

```
[PLATFORM_ADMIN] ──> System-wide access, All Businesses, Subscriptions, Platform Metrics
[BUSINESS_ADMIN] ──> Business Profile, Agent Invites, All Business Tickets, Stripe Billing, Reports
[SUPPORT_AGENT]  ──> Assigned Ticket Queue, Customer Replies, Status Updates, Private Internal Notes
[CUSTOMER]       ──> My Support Tickets, Create Ticket, Live Chat, View Ticket Status
```

| Feature / Module | Platform Admin | Business Admin | Support Agent | Customer |
| :--- | :---: | :---: | :---: | :---: |
| **Platform Management** | ✅ | ❌ | ❌ | ❌ |
| **Suspend Business** | ✅ | ❌ | ❌ | ❌ |
| **Invite Support Agents** | ❌ | ✅ | ❌ | ❌ |
| **Manage Subscription** | ❌ | ✅ | ❌ | ❌ |
| **View Business Reports**| ❌ | ✅ | ❌ | ❌ |
| **View All Company Tickets**| ❌ | ✅ | ❌ | ❌ |
| **View Assigned Queue** | ❌ | ✅ | ✅ | ❌ |
| **Reply to Customer** | ❌ | ✅ | ✅ | ❌ |
| **Add Private Notes** | ❌ | ✅ | ✅ | ❌ (Hidden) |
| **Create Support Ticket**| ❌ | ❌ | ❌ | ✅ |
| **View My Tickets** | ❌ | ❌ | ❌ | ✅ |

---

## 5. Core Modules & Specifications

### A. Authentication & Session Management
- **Providers**: Email/Password + Google OAuth via Firebase Auth SDK.
- **Backend Verification**: `authenticate` middleware verifies Firebase ID Token (or JWT fallback) and populates `req.user` from PostgreSQL database.
- **Security**: Rate limiting on auth endpoints (10 attempts / 15 mins per IP).
- **Password Reset**: Forgot & Reset Password flows via Firebase `sendPasswordResetEmail` and backend verification.

### B. Business & Team Management
- **Account Creation**: Business Admin signup automatically provisions a business account.
- **Agent Invitations**: Business Admin invites support agents via email token link.
- **Plan Enforcement**:
  - **Free Plan**: Max 1 Support Agent, 25 Tickets/Month.
  - **Standard Plan**: Max 5 Support Agents, Unlimited Tickets.
  - **Business Plan**: Max 20 Support Agents, Unlimited Tickets, Advanced Reports.

### C. Ticket Management & Real-Time Chat
- **Statuses**: `OPEN` -> `ASSIGNED` -> `IN_PROGRESS` -> `WAITING_FOR_CUSTOMER` -> `RESOLVED` -> `CLOSED`.
- **Activity Timeline**: Every status update, assignee change, priority shift, and internal note is immutably logged in `TicketActivity`.
- **Real-Time Messaging**: Socket.IO room `ticket:${ticketId}` with live typing indicators and presence.
- **Agent Private Notes**: Stored in `InternalNote` table; strictly invisible to Customer role.

### D. Push Notifications & Messaging
- Firebase Cloud Messaging (FCM) browser notifications for New Ticket, Ticket Assigned, New Message, and Resolution events.
- PostgreSQL `Notification` history table with "Mark as Read" functionality.

### E. Subscription & Payments (Stripe)
- Stripe Checkout Session creation for plan subscription & upgrades.
- Webhook signature verification (`express.raw()`) for `customer.subscription.created`, `updated`, `deleted`.

---

## 6. Directory Map & Repository Structure

```
SupportFlow/
├── PROJECT_CONTEXT.md        # This master single-source-of-truth document
├── CLAUDE.md                 # Assistant decision framework & operational guidelines
├── README.md                 # Project summary and quick start guide
├── .agents/
│   └── skills/
│       ├── nodejs-backend/
│       │   └── SKILL.md      # Backend engineering standards skill
│       └── reactjs-frontend/
│           └── SKILL.md      # Frontend engineering standards skill
├── docs/
│   ├── FIREBASE_SETUP.md     # Firebase & OAuth console setup guide
│   ├── ENVIRONMENT_SETUP.md  # Step-by-step local dev setup
│   ├── ER_DIAGRAM.md         # Database schema visual diagram
│   ├── compliance-matrix.md  # Security, privacy, multi-tenant compliance
│   ├── dev-checklist.md      # 1-page developer decision checklist
│   └── decisions/
│       └── ADR-0001-monorepo-architecture.md
│
├── backend/                  # Node.js + Express + TypeScript Backend
│   ├── prisma/               # schema.prisma, seed.ts
│   ├── src/
│   │   ├── app.ts            # Express setup & middlewares
│   │   ├── index.ts          # Server listener & Socket.IO init
│   │   ├── config/           # env, firebase, stripe, cors, swagger
│   │   ├── common/           # constants, exceptions, responses, types
│   │   ├── middleware/       # authenticate, authorize, validate, rateLimiter, securityHeaders
│   │   ├── modules/          # auth, business, tickets, chat, notifications, subscriptions, dashboard
│   │   ├── socket/           # socketServer.ts
│   │   └── utils/            # prisma singleton
│
└── frontend/                 # React 19 + TypeScript + Vite Frontend
    ├── src/
    │   ├── main.tsx, App.tsx, index.css
    │   ├── shared/           # Centralized Shared Core
    │   │   ├── api/          # apiClient.ts
    │   │   ├── components/   # ui/ (Button, Input, Card, Badge)
    │   │   ├── config/       # firebase.ts
    │   │   ├── layouts/      # DashboardLayout.tsx
    │   │   ├── lib/          # cn.ts
    │   │   ├── routes/       # AppRoutes.tsx, ProtectedRoute.tsx
    │   │   ├── store/        # authStore.ts
    │   │   └── types/        # index.ts
    │   └── features/         # Domain Feature Modules
    │       ├── auth/         # api/, pages/ (LoginPage, ForgotPassword, ResetPassword)
    │       ├── dashboard/    # api/, pages/ (BusinessAdmin, PlatformAdmin, Agent)
    │       └── tickets/      # api/, components/ (ChatBox, PrivateNotes, Timeline), pages/
```

---

## 7. Decision Log (ADR Index)

- **ADR-0001**: Monorepo structure with dual `/backend` & `/frontend` directories, feature-driven frontend layout, Prisma PostgreSQL ORM, and Socket.IO real-time engine.
