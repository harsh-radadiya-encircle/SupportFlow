# 🚀 SupportFlow — Deployment Guide

## Overview

This guide covers deploying SupportFlow to production. The backend is a Node.js/Express app, and the frontend is a React/Vite static site.

---

## 🚀 Quick Deployment: Render (Backend) + Vercel (Frontend)

This is the recommended stack for SupportFlow. Render handles Node.js + WebSockets + PostgreSQL, while Vercel serves the React SPA.

---

### 🖥️ 1. Backend Deployment on Render

1. Create a **PostgreSQL Database** on Render (or use Supabase/Neon). Copy the Connection String.
2. In Render Dashboard, click **New + → Web Service**.
3. Connect your GitHub repository.
4. Configure settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `<your-postgresql-url>`
   - `JWT_SECRET` = `<random-32-char-string>`
   - `FRONTEND_URL` = `https://<your-app>.vercel.app`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
6. Deploy! Your backend URL will be: `https://<your-backend>.onrender.com`.

---

### 🌐 2. Frontend Deployment on Vercel

1. In Vercel Dashboard, click **Add New → Project**.
2. Select your repository.
3. Configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variables:
   - `VITE_API_URL` = `https://<your-backend>.onrender.com/api/v1`
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.
5. Deploy! Your frontend URL will be: `https://<your-app>.vercel.app`.

---

### 🔗 3. Post-Deployment Linking

1. In **Render Backend**: Set `FRONTEND_URL` = `https://<your-app>.vercel.app`.
2. In **Firebase Console**: Go to Auth → Settings → Authorized Domains → Add `<your-app>.vercel.app`.
3. In **Razorpay Dashboard**: Add Webhook URL `https://<your-backend>.onrender.com/api/v1/subscriptions/webhook`.

---

## 📋 Pre-Deployment Checklist

### Security
- [ ] Replace all development keys with production keys (Firebase, Razorpay)
- [ ] Set `NODE_ENV=production`
- [ ] Set strong `JWT_SECRET` (minimum 64 characters, random)
- [ ] Update `FRONTEND_URL` to production domain (for CORS)
- [ ] Configure Razorpay **live** keys (`rzp_live_...`)
- [ ] Set up Razorpay webhook with the production endpoint URL
- [ ] Ensure `.env` files are NOT committed to Git

### Database
- [ ] Provision a managed PostgreSQL instance (e.g., Supabase, Railway, AWS RDS, Neon)
- [ ] Run `npx prisma migrate deploy` on the production database
- [ ] Set up automated database backups

### Firebase
- [ ] Use a dedicated Firebase project for production
- [ ] Enable Email/Password and Google auth providers
- [ ] Add production domain to Firebase authorized domains
- [ ] Generate a new Service Account key for backend Admin SDK
- [ ] Configure FCM VAPID key for web push notifications

### Email (SMTP)
- [ ] Set up transactional email service (SendGrid, AWS SES, Resend)
- [ ] Verify sending domain (DKIM, SPF, DMARC records)

---

## 🖥️ Backend Deployment

### Option A: Railway / Render / Fly.io (Recommended for MVP)

```bash
# Build the TypeScript project
cd backend
npm run build    # Outputs to dist/

# Start production server
node dist/index.js
```

**package.json scripts:**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts"
  }
}
```

**Required Environment Variables** (set in your platform's dashboard):
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
FRONTEND_URL=https://yourdomain.com
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM_EMAIL=...
SMTP_FROM_NAME=SupportFlow
```

---

### Option B: VPS (Ubuntu) with PM2

```bash
# 1. Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 process manager
npm install -g pm2

# 3. Clone and build
git clone https://github.com/your-org/SupportFlow.git
cd SupportFlow/backend
cp .env.example .env   # Fill in production values
npm install
npx prisma migrate deploy
npm run build

# 4. Start with PM2
pm2 start dist/index.js --name "supportflow-backend"
pm2 save
pm2 startup   # Follow the output instructions to enable auto-restart

# 5. Set up Nginx reverse proxy
# /etc/nginx/sites-available/supportflow-api
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';  # Required for WebSocket
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site and reload Nginx
sudo ln -s /etc/nginx/sites-available/supportflow-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. Set up SSL with Let's Encrypt
sudo certbot --nginx -d api.yourdomain.com
```

---

## 🌐 Frontend Deployment

### Option A: Vercel (Recommended)

```bash
cd frontend
npm run build    # Outputs to dist/

# Or install Vercel CLI
npm i -g vercel
vercel --prod
```

**Vercel Environment Variables** (set in Project Settings):
```
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_SOCKET_URL=https://api.yourdomain.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
VITE_RAZORPAY_KEY_ID=rzp_live_...
```

---

### Option B: Netlify

```bash
cd frontend
npm run build

# netlify.toml (for React Router SPA routing)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Option C: Static Server (Nginx)

```bash
cd frontend
npm run build
# Copy dist/ to /var/www/supportflow/

# Nginx config for SPA
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/supportflow;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;    # SPA fallback
    }
}
```

---

## 🔌 Razorpay Webhook Setup

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → Webhooks
2. Add webhook URL: `https://api.yourdomain.com/api/v1/subscriptions/webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `subscription.charged`
   - `subscription.cancelled`
4. Copy the webhook secret and set it as `RAZORPAY_WEBHOOK_SECRET`

---

## 📊 Monitoring & Logging

### Recommended Tools
- **APM**: Sentry (error tracking) or New Relic
- **Logs**: Logtail, Papertrail, or CloudWatch
- **Uptime**: UptimeRobot or BetterUptime

### Health Check Endpoint
```
GET /api/v1/
Response: { "message": "SupportFlow API V1 Operational" }
```

---

## 🔄 Database Migrations in CI/CD

Add this to your CI/CD pipeline before starting the server:

```bash
npx prisma migrate deploy
```

> ⚠️ Never run `prisma migrate dev` in production — it may reset data.

---

## 🐳 Docker (Optional)

```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/supportflow
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: supportflow
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```
