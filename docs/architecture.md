# 🏗️ SupportFlow — System Architecture

## Overview

SupportFlow is a **multi-tenant customer support platform** built on a monorepo structure with a strict separation between the React frontend and the Node.js/Express backend.

---

## 📁 Project Root Structure

```
SupportFlow/
├── backend/                  # Express.js TypeScript API server
├── frontend/                 # React 19 + Vite TypeScript app
├── docs/                     # Project documentation (this folder)
│   ├── README.md             # Documentation index
│   ├── architecture.md       # This file
│   ├── api-reference.md      # REST API reference
│   ├── socket-events.md      # Socket.IO events reference
│   ├── authentication.md     # Auth & RBAC guide
│   ├── database-schema.md    # DB schema & ERD
│   ├── subscription-billing.md  # Razorpay billing guide
│   ├── environment-setup.md  # Environment variables
│   ├── deployment.md         # Deployment guide
│   └── postman/
│       └── SupportFlow.postman_collection.json
├── PROJECT_CONTEXT.md        # High-level project summary
└── README.md                 # Quick start guide
```

---

## 📁 Backend Structure

```
backend/
├── src/
│   ├── app.ts                # Express app setup (CORS, middleware, routes)
│   ├── index.ts              # HTTP server + Socket.IO bootstrap
│   ├── config/               # App configuration (env, firebase, razorpay)
│   ├── common/               # Shared utilities
│   │   ├── exceptions/       # ApiError class
│   │   ├── responses/        # Standardized API response helper
│   │   └── types/            # Shared TypeScript types & interfaces
│   ├── middleware/           # Express middleware
│   │   ├── authenticate.ts   # Firebase JWT token verification
│   │   ├── authorize.ts      # Role-Based Access Control (RBAC)
│   │   ├── errorHandler.ts   # Global error handler
│   │   ├── logger.ts         # Request logger (morgan)
│   │   ├── rateLimiter.ts    # express-rate-limit configuration
│   │   ├── securityHeaders.ts # Helmet security headers
│   │   └── validate.ts       # Zod schema validation middleware
│   ├── modules/              # Domain-driven feature modules
│   │   ├── auth/             # Authentication (check provider, sync, logout)
│   │   ├── users/            # User profile management & admin operations
│   │   ├── tickets/          # Ticket CRUD, assignment, notes, CSAT
│   │   │   └── services/
│   │   │       ├── ticket-crud.service.ts
│   │   │       └── ticket-assignment.service.ts
│   │   ├── invitations/      # Agent invitation flow
│   │   ├── notifications/    # In-app notification management
│   │   ├── subscriptions/    # Razorpay billing, plans, webhooks
│   │   └── dashboard/        # Role-specific metrics & reports
│   ├── routes/
│   │   └── index.ts          # Central route aggregator (/api/v1/*)
│   ├── services/             # Shared services
│   │   └── notification.service.ts  # Firebase FCM + DB notification sender
│   ├── socket/
│   │   └── socketServer.ts   # Socket.IO server with rooms & events
│   ├── prisma/               # Prisma client instance
│   ├── jobs/                 # Background cron jobs (subscription expiry, etc.)
│   └── utils/                # Utility helpers (prisma client, etc.)
├── prisma/
│   └── schema.prisma         # Database schema definition
├── .env                      # Environment variables (never commit)
├── .env.example              # Environment variable template
├── tsconfig.json
└── package.json
```

---

## 📁 Frontend Structure

```
frontend/
├── src/
│   ├── App.tsx               # Root component with React Router setup
│   ├── main.tsx              # React entry point
│   ├── index.css             # Global styles & Tailwind directives
│   ├── features/             # Feature-based modules
│   │   ├── auth/             # Login, register, invite acceptance pages
│   │   ├── businesses/       # Business listing & management
│   │   ├── dashboard/        # Role-specific dashboards
│   │   ├── invitations/      # Team management & invite UI
│   │   ├── landing/          # Public landing page
│   │   ├── notifications/    # Notification bell & list
│   │   ├── profile/          # User profile settings
│   │   ├── subscriptions/    # Plan selection & billing UI
│   │   ├── tickets/          # Ticket list, detail, chat view
│   │   └── users/            # Admin user management
│   └── shared/               # Reusable across features
│       ├── components/       # Shared UI components
│       ├── hooks/            # Custom React hooks (useDebounce, etc.)
│       ├── lib/              # Utilities (dateUtils, axios instance, etc.)
│       └── store/            # Zustand global stores
├── public/                   # Static assets
├── index.html                # Vite entry HTML
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 🔄 Request Lifecycle

```
Browser/Client
    │
    ▼
Firebase Auth (ID Token)
    │
    ▼
[HTTP] POST /api/v1/auth/sync   ← Syncs Firebase user to PostgreSQL
    │
    ▼
Subsequent Authenticated Requests:
    Authorization: Bearer <Firebase ID Token>
    │
    ▼
authenticate middleware   ← Verifies token via Firebase Admin SDK
    │                       Attaches req.user (from PostgreSQL)
    ▼
authorize middleware       ← Checks req.user.role against allowed roles
    │
    ▼
validate middleware        ← Runs Zod schema validation on req.body
    │
    ▼
Controller                ← Calls Service layer
    │
    ▼
Service                   ← Business logic + Prisma ORM
    │
    ▼
PostgreSQL (via Prisma)
```

---

## 🔌 Real-Time Architecture (Socket.IO)

```
Client (React)
    │
    ├── connect()  →  ws://localhost:5000
    │
    ├── emit("join_user_room", userId)    → Joins user:${userId} room
    ├── emit("join_ticket", ticketId)     → Joins ticket:${ticketId} room
    ├── emit("send_message", {...})       → Server persists + broadcasts
    ├── emit("typing_start", {...})       → Broadcasts to ticket room
    ├── emit("mark_messages_read", {...}) → Updates DB + notifies room
    │
    ├── on("receive_message")             → New chat message
    ├── on("user_typing_start")           → Typing indicator on
    ├── on("user_typing_stop")            → Typing indicator off
    ├── on("messages_read")               → Read receipt
    ├── on("user_status_change")          → Online/offline presence
    └── on("new_notification")            → Real-time push notification
```

---

## 🛡️ Security Architecture

| Layer | Mechanism |
|-------|-----------|
| Authentication | Firebase Admin SDK ID Token verification on every request |
| Authorization | Role-Based Access Control (RBAC) via `authorize` middleware |
| Rate Limiting | `express-rate-limit` on auth endpoints (100 req/15min) |
| Security Headers | `helmet` middleware (CSP, HSTS, X-Frame-Options, etc.) |
| Input Validation | `zod` schema validation on all POST/PATCH request bodies |
| Webhook Integrity | Razorpay HMAC-SHA256 signature verification |
| Environment | All secrets in `.env`, never committed to source control |

---

## 🗄️ Database Architecture

- **Database**: PostgreSQL
- **ORM**: Prisma ORM (type-safe queries, migrations)
- **Connection**: Single `PrismaClient` instance (singleton pattern in `src/utils/prisma.ts`)
- **Schema Location**: `backend/prisma/schema.prisma`

See [database-schema.md](./database-schema.md) for full entity documentation.

---

## 💳 Subscription Architecture

- **Provider**: Razorpay (Indian payment gateway)
- **Plans**: FREE → STANDARD (₹2,499/mo) → BUSINESS (₹6,499/mo)
- **Flow**: Client creates order → Razorpay Checkout Modal → HMAC webhook verifies payment → DB updated
- **Enforcement**: Plan limits checked server-side before ticket/agent creation

See [subscription-billing.md](./subscription-billing.md) for full flow documentation.
