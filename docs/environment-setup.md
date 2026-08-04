# ⚙️ SupportFlow — Environment Setup Guide

## Overview

This guide covers all environment variables required for both the **backend** and **frontend** applications.

---

## 🖥️ Backend Environment Variables

Location: `backend/.env`

Template: `backend/.env.example`

```bash
# ─────────────────────────────────────────────────────────────
# SERVER
# ─────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development                  # development | production | test

# ─────────────────────────────────────────────────────────────
# DATABASE (PostgreSQL via Prisma)
# ─────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/supportflow?schema=public"

# ─────────────────────────────────────────────────────────────
# JWT (backup tokens & Socket.IO auth)
# ─────────────────────────────────────────────────────────────
JWT_SECRET="your-super-secret-key-min-32-chars"

# ─────────────────────────────────────────────────────────────
# FRONTEND URL (for CORS whitelist)
# ─────────────────────────────────────────────────────────────
FRONTEND_URL="http://localhost:5173"  # Production: https://yourdomain.com

# ─────────────────────────────────────────────────────────────
# FIREBASE ADMIN SDK
# Get from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
# ─────────────────────────────────────────────────────────────
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# ⚠️ Keep \n as literal \n in the .env file (not actual newlines)

# ─────────────────────────────────────────────────────────────
# RAZORPAY (Payment Gateway)
# Get from: https://dashboard.razorpay.com/app/keys
# ─────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID="rzp_test_..."            # rzp_live_... in production
RAZORPAY_KEY_SECRET="your-key-secret"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"
RAZORPAY_STANDARD_PLAN_ID="plan_standard"
RAZORPAY_BUSINESS_PLAN_ID="plan_business"

# ─────────────────────────────────────────────────────────────
# EMAIL (SMTP — Nodemailer)
# Options: Gmail App Password, Outlook, SendGrid, Mailtrap (dev)
# ─────────────────────────────────────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
SMTP_FROM_EMAIL="your-email@gmail.com"
SMTP_FROM_NAME="SupportFlow"
```

---

## 🌐 Frontend Environment Variables

Location: `frontend/.env`

Template: `frontend/.env.example`

```bash
# ─────────────────────────────────────────────────────────────
# API & BACKEND
# ─────────────────────────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000

# ─────────────────────────────────────────────────────────────
# FIREBASE CLIENT SDK
# Get from: Firebase Console → Project Settings → Your Apps → Web App Config
# ─────────────────────────────────────────────────────────────
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abc123"
VITE_FIREBASE_VAPID_KEY="BExxx..."  # For FCM Web Push

# ─────────────────────────────────────────────────────────────
# RAZORPAY CLIENT
# ─────────────────────────────────────────────────────────────
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

---

## 📋 Variable Reference Table

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (default: 5000) |
| `NODE_ENV` | Yes | Environment mode |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars) |
| `FRONTEND_URL` | Yes | Allowed CORS origin |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project identifier |
| `FIREBASE_CLIENT_EMAIL` | Yes | Firebase Admin SDK service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Firebase Admin SDK private key (PEM format) |
| `RAZORPAY_KEY_ID` | Yes | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay API key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Razorpay webhook HMAC secret |
| `RAZORPAY_STANDARD_PLAN_ID` | Optional | Razorpay plan ID for Standard |
| `RAZORPAY_BUSINESS_PLAN_ID` | Optional | Razorpay plan ID for Business |
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP server port (587 for TLS) |
| `SMTP_USER` | Yes | SMTP authentication username |
| `SMTP_PASS` | Yes | SMTP authentication password |
| `SMTP_FROM_EMAIL` | Yes | From email address |
| `SMTP_FROM_NAME` | Yes | From display name |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend API base URL |
| `VITE_SOCKET_URL` | Yes | Socket.IO server URL |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase Web SDK API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase Web App ID |
| `VITE_FIREBASE_VAPID_KEY` | Yes | VAPID key for Web Push Notifications |
| `VITE_RAZORPAY_KEY_ID` | Yes | Razorpay publishable key |

---

## 🛠️ Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/SupportFlow.git
cd SupportFlow

# 2. Set up backend
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npx prisma generate
npx prisma migrate dev
npm run dev        # Starts on http://localhost:5000

# 3. Set up frontend (new terminal)
cd ../frontend
cp .env.example .env
# Edit .env with your Firebase config
npm install
npm run dev        # Starts on http://localhost:5173
```

---

## 🔐 Security Notes

- **Never commit `.env` files** — they are in `.gitignore`
- Use **different Firebase projects** for development and production
- Use **Razorpay test keys** (`rzp_test_...`) in development, **live keys** (`rzp_live_...`) in production
- Rotate `JWT_SECRET` periodically in production
- For Gmail SMTP, use **App Passwords** (not your regular password) — Enable 2FA first
- Store production secrets in a secrets manager (AWS Secrets Manager, GCP Secret Manager, etc.)
