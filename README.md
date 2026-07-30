# SupportFlow 🚀

> **SupportFlow** is a lightweight, multi-tenant customer support platform designed for small businesses to consolidate disconnected customer requests (WhatsApp, email, phone) into real-time support tickets with agent assignment, real-time chat, analytics, push notifications, and subscription billing.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + custom glassmorphism design system + shadcn/ui primitives
- **State & Data Caching**: Zustand (UI/Session state) + TanStack Query v5 (Server API caching)
- **Forms & Validation**: React Hook Form + Zod
- **Networking & Real-Time**: Axios + Socket.IO Client
- **Auth & Push Notifications**: Firebase SDK + FCM
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js + Express.js + TypeScript
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Real-Time Communication**: Socket.IO (Ticket rooms & presence)
- **Authentication**: Firebase Admin SDK + JWT token verification
- **Payments**: Razorpay SDK (Checkout Modal, HMAC Webhooks, Subscriptions)
- **API Documentation**: Swagger / OpenAPI (`http://localhost:5000/api-docs`)

---

## 📁 Architecture & Folder Structure

- `backend/`: Express TypeScript API server with domain-driven modules (`auth`, `business`, `tickets`, `chat`, `notifications`, `subscriptions`, `dashboard`, `reports`, `socket`, `prisma`).
- `frontend/`: React 19 Vite TypeScript application with feature-based architecture (`features`, `components`, `layouts`, `routes`, `services`, `store`, `types`).
- `docs/`: System ER diagrams, environment setup guide, and documentation.

---

## ⚡ Quick Start

### 1. Backend Server
```bash
cd backend
npm install
npx prisma generate
npm run dev
```

### 2. Frontend App
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to access the SupportFlow console!
