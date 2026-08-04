# 🔐 SupportFlow — Authentication & RBAC Guide

## Overview

SupportFlow uses **Firebase Authentication** as the identity provider. All tokens are verified server-side using the **Firebase Admin SDK**. PostgreSQL is the source of truth for user roles and business associations.

---

## 👤 User Roles

| Role | Enum Value | Description |
|------|-----------|-------------|
| Platform Admin | `PLATFORM_ADMIN` | Global admin; manages all businesses, plans, and suspensions |
| Business Admin | `BUSINESS_ADMIN` | Manages their business, invites agents, views all tickets |
| Support Agent | `SUPPORT_AGENT` | Handles assigned tickets, replies, adds internal notes |
| Customer | `CUSTOMER` | Creates tickets, sends messages, views their own tickets |

---

## 🔄 Authentication Flow

### 1. New User Registration (Business Admin or Customer)

```
1. User completes Firebase Auth (Email/Password or Google Sign-In)
2. Firebase returns an ID Token (JWT, expires in 1 hour)
3. Client calls POST /api/v1/auth/sync
   - Header: Authorization: Bearer <Firebase ID Token>
   - Body: { role: "BUSINESS_ADMIN", businessName: "Acme Inc", fullName: "John Doe" }
4. Backend verifies the ID Token via Firebase Admin SDK
5. Backend upserts user in PostgreSQL with the provided role
6. Backend returns the user profile with role + businessId
7. Client stores user in Zustand store + TanStack Query cache
```

### 2. Returning User Login

```
1. User signs in via Firebase (email/password or Google)
2. Firebase returns ID Token
3. Client calls POST /api/v1/auth/sync
   - Body: { mode: "login" }  ← No role or businessName needed for existing users
4. Backend finds existing user by firebaseUid and returns their profile
```

### 3. Agent Invitation Flow

```
1. Business Admin calls POST /api/v1/invitations
   - Body: { email: "agent@company.com", role: "SUPPORT_AGENT" }
2. System creates invitation record + sends email with token link
3. Agent receives email → clicks link → frontend reads /verify/:token
4. Agent registers via Firebase, then calls POST /api/v1/invitations/accept
   - Body: { token, firebaseUid, fullName, authProvider }
5. Backend creates agent user linked to the business
```

### 4. Token Verification (Every Protected Request)

```
Authorization: Bearer <Firebase ID Token>
    │
    ▼
authenticate middleware (backend/src/middleware/authenticate.ts)
    ├── Extracts Bearer token from Authorization header
    ├── Verifies token: admin.auth().verifyIdToken(token, true)
    ├── Looks up user in PostgreSQL by firebaseUid
    ├── Checks user.isActive === true
    └── Attaches req.user = { id, email, role, businessId, ... }
```

---

## 🛡️ Role-Based Access Control (RBAC)

### Middleware Usage

```typescript
// In route definition:
router.get('/admin/all',
  authenticate,                    // Step 1: Verify identity
  authorize(['PLATFORM_ADMIN']),   // Step 2: Check role
  UsersController.getAllUsers
);
```

### Role Permission Matrix

| Endpoint Group | CUSTOMER | SUPPORT_AGENT | BUSINESS_ADMIN | PLATFORM_ADMIN |
|---------------|----------|---------------|----------------|----------------|
| Auth (sync, me, logout) | ✅ | ✅ | ✅ | ✅ |
| Create Ticket | ✅ | ✅ | ✅ | ✅ |
| View Tickets | Own only | Assigned | All in business | All |
| Update Ticket Status | ❌ | ✅ | ✅ | ✅ |
| Assign Ticket | ❌ | ✅ | ✅ | ✅ |
| Add Internal Note | ❌ | ✅ | ✅ | ✅ |
| Submit CSAT Rating | ✅ | ❌ | ❌ | ❌ |
| Invite Agents | ❌ | ❌ | ✅ | ❌ |
| Manage Team | ❌ | ❌ | ✅ | ❌ |
| Business Dashboard | ❌ | ✅ (limited) | ✅ | ❌ |
| Platform Dashboard | ❌ | ❌ | ❌ | ✅ |
| Suspend Business | ❌ | ❌ | ❌ | ✅ |
| Manage Subscription | ❌ | ❌ | ✅ | ❌ |
| Delete Users | ❌ | ❌ | ❌ | ✅ |

---

## 🔑 Auth Endpoints Reference

### POST /api/v1/auth/check-provider
Check if an email already exists and which provider is linked.

**Request:**
```json
{ "email": "user@example.com" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exists": true,
    "providers": ["EMAIL_PASSWORD"]
  }
}
```

---

### POST /api/v1/auth/sync
Register new user or sync returning user. Requires Firebase ID Token in Authorization header.

**Headers:**
```
Authorization: Bearer <Firebase_ID_Token>
```

**Request Body (new Business Admin):**
```json
{
  "role": "BUSINESS_ADMIN",
  "businessName": "Acme Support Inc",
  "fullName": "John Doe",
  "mode": "register"
}
```

**Request Body (returning user):**
```json
{
  "mode": "login"
}
```

---

### GET /api/v1/auth/me
Get the authenticated user's full profile.

**Headers:**
```
Authorization: Bearer <Firebase_ID_Token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cuid-xxx",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "BUSINESS_ADMIN",
    "businessId": "cuid-yyy",
    "isActive": true,
    "avatarUrl": null
  }
}
```

---

## 🔄 Token Refresh Strategy

Firebase ID Tokens expire after **1 hour**. The Firebase SDK automatically refreshes tokens in the background. When making API calls:

1. Always call `auth.currentUser.getIdToken()` — this auto-refreshes if needed
2. Use the fresh token in every request header
3. On `401 Unauthorized` from backend, force token refresh: `getIdToken(true)`

---

## 📧 Auth Providers

| Provider | Enum | Notes |
|----------|------|-------|
| Email + Password | `EMAIL_PASSWORD` | Standard Firebase email auth |
| Google OAuth | `GOOGLE` | Firebase Google Sign-In |

Both providers are supported. Users can have multiple providers linked to a single account.
