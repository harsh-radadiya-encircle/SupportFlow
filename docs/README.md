# 📚 SupportFlow — Documentation Hub

Welcome to the SupportFlow documentation. All project documentation lives in this `docs/` folder.

---

## 📂 Documentation Index

| File | Description |
|------|-------------|
| [architecture.md](./architecture.md) | System architecture, full folder structure, request lifecycle, security layers |
| [api-reference.md](./api-reference.md) | Complete REST API reference — all endpoints, request bodies, response shapes |
| [swagger.md](./swagger.md) | Swagger/OpenAPI setup, how to authenticate in Swagger UI, full paths spec |
| [socket-events.md](./socket-events.md) | All Socket.IO events verified from source — payloads, notification types, tips |
| [database-schema.md](./database-schema.md) | Prisma ER diagram (Mermaid), all tables, enums, and index strategy |
| [authentication.md](./authentication.md) | Firebase auth flow, JWT, RBAC role matrix, token refresh strategy |
| [firebase-setup.md](./firebase-setup.md) | Step-by-step Firebase project setup — Auth, FCM, Admin SDK, VAPID key |
| [razorpay-webhook-setup.md](./razorpay-webhook-setup.md) | Razorpay webhook registration, HMAC verification, all handled events |
| [subscription-billing.md](./subscription-billing.md) | Plan tiers, payment flow, cancellation/downgrade, plan enforcement |
| [environment-setup.md](./environment-setup.md) | All environment variables for backend & frontend with descriptions |
| [deployment.md](./deployment.md) | Production deployment guide — Railway, Vercel, VPS, Docker, Nginx |
| [postman/SupportFlow.postman_collection.json](./postman/SupportFlow.postman_collection.json) | Importable Postman collection — all endpoints with examples & auto-variables |

---

## 🚀 Quick Links

| Resource | URL |
|----------|-----|
| **API Base URL (Dev)** | `http://localhost:5000/api/v1` |
| **Swagger UI (Dev)** | `http://localhost:5000/api-docs` |
| **Health Check** | `http://localhost:5000/health` |
| **Frontend (Dev)** | `http://localhost:5173` |
| **Prisma Studio** | `cd backend && npx prisma studio` |

---

## 📖 Where to Start

| Goal | Read This |
|------|-----------|
| New to the project | [architecture.md](./architecture.md) |
| Setting up locally | [environment-setup.md](./environment-setup.md) |
| Firebase configuration | [firebase-setup.md](./firebase-setup.md) |
| Razorpay / billing setup | [razorpay-webhook-setup.md](./razorpay-webhook-setup.md) |
| Testing API endpoints | Import [Postman collection](./postman/SupportFlow.postman_collection.json) |
| Understanding the database | [database-schema.md](./database-schema.md) |
| Working with real-time events | [socket-events.md](./socket-events.md) |
| Deploying to production | [deployment.md](./deployment.md) |

---

## 🛠 Technology Stack at a Glance

| Layer | Tech |
|-------|------|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| **State** | Zustand + TanStack Query |
| **Forms** | React Hook Form + Zod |
| **Backend** | Node.js + Express.js + TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | Firebase Authentication + Admin SDK |
| **Real-Time** | Socket.IO |
| **Payments** | Razorpay |
| **Notifications** | Firebase Cloud Messaging (FCM) |
| **API Docs** | Swagger UI (`/api-docs`) |
