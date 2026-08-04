# SupportFlow

> **Multi-tenant customer support platform** — centralize customer tickets, real-time chat, agent management, push notifications, and subscription billing in one place.

Built for small businesses that currently manage support requests through WhatsApp, email, and phone calls.

---

## ✨ Features

| Module | Capabilities |
|--------|-------------|
| **Authentication** | Firebase (Email/Password + Google), RBAC with 4 roles, self-healing user sync |
| **Ticket Management** | Create, assign, update status, internal notes, activity timeline, CSAT ratings |
| **Real-Time Chat** | Socket.IO ticket rooms, typing indicators, read receipts, presence tracking |
| **Push Notifications** | Firebase FCM browser push + in-app notification center |
| **Business Management** | Multi-tenant architecture, agent invitations, team management |
| **Subscription Billing** | Razorpay checkout, HMAC webhook verification, FREE/STANDARD/BUSINESS plans |
| **Dashboards** | Role-specific metrics — Platform Admin, Business Admin, and Support Agent views |
| **Reports** | CSAT ratings, ticket trends, resolution time charts |
| **API Documentation** | Swagger UI at `/api-docs` |

---

## 🛠 Technology Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React 19 + TypeScript + Vite | Core framework |
| Tailwind CSS + shadcn/ui | Styling & UI primitives |
| Zustand | Client-side UI state |
| TanStack Query v5 | Server state & API caching |
| React Hook Form + Zod | Form validation |
| Axios | HTTP client |
| React Router v6 | Client-side routing |
| Socket.IO Client | Real-time communication |
| Firebase SDK | Authentication + FCM push |
| Recharts | Dashboard charts |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express.js + TypeScript | API server |
| PostgreSQL + Prisma ORM | Database & type-safe queries |
| Socket.IO | Real-time WebSocket rooms |
| Firebase Admin SDK | Token verification server-side |
| Razorpay SDK | Payment orders + webhook verification |
| Nodemailer | SMTP email (agent invitations) |
| Zod | Request body validation |
| Helmet + express-rate-limit | Security headers + rate limiting |
| Swagger UI | Interactive API documentation |

---

## 👥 User Roles

| Role | Access |
|------|--------|
| `PLATFORM_ADMIN` | Manage all businesses, view subscriptions, suspend/reactivate accounts |
| `BUSINESS_ADMIN` | Manage business, invite agents, view all tickets, manage billing |
| `SUPPORT_AGENT` | View assigned tickets, reply, update status, add internal notes |
| `CUSTOMER` | Create tickets, send messages, view own tickets, submit CSAT ratings |

---

## 💳 Subscription Plans

| Plan | Agents | Tickets/mo | Monthly | Yearly |
|------|--------|-----------|---------|--------|
| FREE | 1 | 25 | ₹0 | ₹0 |
| STANDARD | 5 | Unlimited | ₹2,499 | ₹24,990 |
| BUSINESS | 20 | Unlimited | ₹6,499 | ₹64,990 |

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Firebase project (for auth + FCM)
- Razorpay account (for billing)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/SupportFlow.git
cd SupportFlow
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials (see docs/environment-setup.md)

npm install
npx prisma generate
npx prisma migrate dev
npm run dev
# ✅ Backend running at http://localhost:5000
# 📖 Swagger UI at http://localhost:5000/api-docs
```

### 3. Frontend Setup

```bash
cd ../frontend
cp .env.example .env
# Edit .env with your Firebase config (see docs/environment-setup.md)

npm install
npm run dev
# ✅ Frontend running at http://localhost:5173
```

---

## 📁 Project Structure

```
SupportFlow/
├── backend/                # Express.js TypeScript API server
│   ├── prisma/
│   │   └── schema.prisma   # Database schema (single source of truth)
│   └── src/
│       ├── config/         # Firebase, Razorpay, Swagger, env config
│       ├── middleware/      # Auth, RBAC, rate limiting, validation
│       ├── modules/         # Feature modules (auth, tickets, users, ...)
│       ├── services/        # Shared services (notifications, email)
│       └── socket/          # Socket.IO server & event handlers
├── frontend/               # React 19 + Vite TypeScript app
│   └── src/
│       ├── features/        # Feature-based modules
│       └── shared/          # Hooks, components, stores, layouts
└── docs/                   # 📚 Full project documentation
    ├── README.md
    ├── architecture.md
    ├── api-reference.md
    ├── swagger.md
    ├── socket-events.md
    ├── database-schema.md
    ├── authentication.md
    ├── firebase-setup.md
    ├── razorpay-webhook-setup.md
    ├── subscription-billing.md
    ├── environment-setup.md
    ├── deployment.md
    └── postman/
        └── SupportFlow.postman_collection.json
```

---

## 📚 Documentation

| Document | Link |
|----------|------|
| Architecture & Folder Structure | [docs/architecture.md](./docs/architecture.md) |
| REST API Reference | [docs/api-reference.md](./docs/api-reference.md) |
| Swagger / OpenAPI | [docs/swagger.md](./docs/swagger.md) |
| Socket.IO Events | [docs/socket-events.md](./docs/socket-events.md) |
| Database ER Diagram | [docs/database-schema.md](./docs/database-schema.md) |
| Authentication & RBAC | [docs/authentication.md](./docs/authentication.md) |
| Firebase Setup Guide | [docs/firebase-setup.md](./docs/firebase-setup.md) |
| Razorpay Webhook Setup | [docs/razorpay-webhook-setup.md](./docs/razorpay-webhook-setup.md) |
| Subscription & Billing | [docs/subscription-billing.md](./docs/subscription-billing.md) |
| Environment Variables | [docs/environment-setup.md](./docs/environment-setup.md) |
| Deployment Guide | [docs/deployment.md](./docs/deployment.md) |
| Postman Collection | [docs/postman/SupportFlow.postman_collection.json](./docs/postman/SupportFlow.postman_collection.json) |

---

## 🔌 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/sync` | Register or login user |
| `GET` | `/api/v1/auth/me` | Get current user profile |
| `POST` | `/api/v1/tickets` | Create support ticket |
| `GET` | `/api/v1/tickets` | List tickets (role-scoped) |
| `PATCH` | `/api/v1/tickets/:id/status` | Update ticket status |
| `POST` | `/api/v1/invitations` | Invite support agent |
| `GET` | `/api/v1/notifications` | Get user notifications |
| `POST` | `/api/v1/subscriptions/razorpay-order` | Create payment order |
| `GET` | `/api/v1/dashboard/business` | Business admin dashboard |
| `GET` | `/api-docs` | Swagger UI |

---

## 🔒 Security

- Firebase ID Token verification on every protected request
- Role-Based Access Control (RBAC) middleware
- Helmet security headers
- express-rate-limit (100 req/min general, 30 req/15min auth)
- Razorpay HMAC-SHA256 webhook signature verification
- Zod schema validation on all request bodies
- Environment variables for all credentials — never hardcoded

---

## 📄 License

MIT
