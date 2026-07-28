# SupportFlow Environment Setup & Local Run Guide

## Prerequisites
- **Node.js**: v18+ or v20+
- **npm**: v9+
- **PostgreSQL Database**: Local or Cloud PostgreSQL (v14+)

---

## 1. Backend Setup (`/backend`)

1. **Navigate to Backend Directory**:
   ```bash
   cd backend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Run Prisma Migrations & Generate Client**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Seed Test Users & Sample Business**:
   ```bash
   npm run prisma:seed
   ```

6. **Start Development API Server**:
   ```bash
   npm run dev
   ```
   The backend API will start at `http://localhost:5000`.
   - **Swagger Docs**: `http://localhost:5000/api-docs`
   - **Health Check**: `http://localhost:5000/health`

---

## 2. Frontend Setup (`/frontend`)

1. **Navigate to Frontend Directory**:
   ```bash
   cd frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Vite Web App**:
   ```bash
   npm run dev
   ```
   The frontend application will start at `http://localhost:5173`.

---

## 3. Seed Credentials for Quick Testing

| Role | Email | Password / Quick Login |
| :--- | :--- | :--- |
| **Platform Admin** | `admin@supportflow.com` | `Password123!` (or Quick Login button) |
| **Business Admin** | `owner@acme.com` | `Password123!` (or Quick Login button) |
| **Support Agent** | `agent@acme.com` | `Password123!` (or Quick Login button) |
| **Customer** | `customer@gmail.com` | `Password123!` (or Quick Login button) |
