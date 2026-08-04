# 🔥 SupportFlow — Firebase Setup Guide

## Overview

SupportFlow uses **Firebase** for two distinct purposes:
1. **Firebase Authentication** — User identity management (Email/Password + Google sign-in)
2. **Firebase Cloud Messaging (FCM)** — Browser/mobile push notifications

The **frontend** uses the Firebase Client SDK. The **backend** uses the Firebase **Admin SDK** to verify tokens server-side.

---

## 📋 Prerequisites

- A Google account
- Access to [Firebase Console](https://console.firebase.google.com)

---

## 🏗️ Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Name it `supportflow-production` (or `supportflow-dev` for development)
4. **Disable** Google Analytics (not needed)
5. Click **"Create project"**

> ⚠️ Create **separate projects** for development and production — never share credentials.

---

## 🔐 Step 2 — Enable Authentication Providers

1. In the left sidebar → **Build → Authentication**
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Enable the following providers:

### Email/Password
1. Click **"Email/Password"**
2. Toggle **"Email/Password"** → **Enabled**
3. Click **Save**

### Google
1. Click **"Google"**
2. Toggle **"Google"** → **Enabled**
3. Set **Project support email** (your Gmail)
4. Click **Save**

---

## 🌐 Step 3 — Add Authorized Domains

1. Still in **Authentication → Settings → Authorized domains**
2. Your `localhost` should already be listed for development
3. For production, click **"Add domain"** and add your frontend URL:
   - `yourdomain.com`
   - `www.yourdomain.com`

---

## 📱 Step 4 — Register a Web App (Client SDK)

1. In the **Project Overview**, click the **"</>"** (Web) icon
2. Enter an app nickname: `SupportFlow Web`
3. **Do NOT check** "Firebase Hosting" (unless you want to use it)
4. Click **"Register app"**
5. Copy the Firebase config object — you'll need these values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "supportflow-xxx.firebaseapp.com",
  projectId: "supportflow-xxx",
  storageBucket: "supportflow-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Add to `frontend/.env`:
```bash
VITE_API_URL=http://localhost:5000/api/v1
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=supportflow-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=supportflow-xxx
VITE_FIREBASE_STORAGE_BUCKET=supportflow-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## 🔔 Step 5 — Set Up Firebase Cloud Messaging (FCM) for Push Notifications

### Get VAPID Key (for Web Push)

1. In the Firebase Console → **Project Settings** (gear icon) → **Cloud Messaging** tab
2. Scroll down to **"Web configuration"**
3. Under **"Web Push certificates"**, click **"Generate key pair"**
4. Copy the generated **VAPID key**

```bash
# Add to frontend/.env:
VITE_FIREBASE_VAPID_KEY=BExxx...your-vapid-key...
```

### Enable FCM API

1. In Firebase Console → **Build → Messaging**
2. Click **"Get started"** if prompted
3. The API is enabled automatically when you generate the VAPID key

---

## 🔑 Step 6 — Generate Admin SDK Service Account (Backend)

1. In Firebase Console → **Project Settings** (gear icon) → **Service accounts** tab
2. Select **"Firebase Admin SDK"**
3. Click **"Generate new private key"**
4. A JSON file downloads — **store this securely, never commit it**

The JSON file looks like:
```json
{
  "type": "service_account",
  "project_id": "supportflow-xxx",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@supportflow-xxx.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

### Add to `backend/.env`:
```bash
FIREBASE_PROJECT_ID=supportflow-xxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@supportflow-xxx.iam.gserviceaccount.com

# Copy the private_key value exactly — keep \n as literal \n characters
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

> ⚠️ **Critical:** The `FIREBASE_PRIVATE_KEY` must have literal `\n` characters (backslash + n), NOT actual newlines. The backend `env.ts` replaces them: `.replace(/\\n/g, '\n')`.

---

## 🔍 Step 7 — Verify Firebase Admin SDK Initialization

Start the backend and look for this log:
```
[Firebase] Admin SDK initialized successfully.
```

If you see this error instead:
```
FATAL: Firebase Admin configuration is missing or invalid.
```
Check that `FIREBASE_PRIVATE_KEY` contains a valid key including `BEGIN PRIVATE KEY` and `END PRIVATE KEY`.

---

## 🌐 How Firebase Auth Works in SupportFlow

```
Frontend (React)                Backend (Express)
     │                               │
     │  1. User signs in via         │
     │     Firebase SDK              │
     │     (Email/Google)            │
     │                               │
     │  2. SDK returns ID Token      │
     │     (JWT, 1hr expiry)         │
     │                               │
     │  3. POST /api/v1/auth/sync    │
     │     Authorization: Bearer     │
     │     <ID_Token>      ────────► │
     │                               │  4. admin.auth().verifyIdToken(token)
     │                               │     → Validates with Firebase servers
     │                               │
     │                               │  5. Find/create user in PostgreSQL
     │                               │     by firebaseUid
     │                               │
     │  6. ◄─── User profile + role ─┤
     │          returned in response │
     │                               │
     │  7. Every subsequent request  │
     │     includes Bearer token     │
     │     (auto-refreshed by SDK)   │
```

---

## 🔄 Token Refresh

The Firebase SDK automatically refreshes ID tokens before they expire (every ~55 minutes). In your frontend API calls, always use:

```typescript
// ✅ Correct — auto-refreshes token if needed
const token = await auth.currentUser?.getIdToken();

// ❌ Wrong — may return an expired token
const token = await auth.currentUser?.getIdToken(false);
```

On a 401 response from the backend, force a refresh:
```typescript
const token = await auth.currentUser?.getIdToken(true); // force refresh
```

---

## 📁 Where Firebase is Used in the Codebase

| File | Purpose |
|------|---------|
| `backend/src/config/firebase.ts` | Admin SDK initialization |
| `backend/src/middleware/authenticate.ts` | Token verification on every request |
| `backend/src/services/notification.service.ts` | FCM push notification dispatch |
| `frontend/src/shared/lib/firebase.ts` | Client SDK initialization |
| `frontend/src/features/auth/` | Login, register, Google sign-in UI |

---

## 🔐 Security Checklist

- [ ] Service account JSON file is **NOT** committed to git (check `.gitignore`)
- [ ] `FIREBASE_PRIVATE_KEY` is only in `.env` files (never hardcoded)
- [ ] Separate Firebase projects for dev and production
- [ ] Production domain is added to Authorized Domains
- [ ] VAPID key is configured for web push in production
- [ ] Firebase App Check enabled (optional but recommended for production)
