# 📖 SupportFlow — Swagger / OpenAPI Setup Guide

## Overview

SupportFlow uses **Swagger UI** (via `swagger-ui-express`) to serve interactive API documentation. In development, it is accessible at:

```
http://localhost:5000/api-docs
```

The current Swagger setup is in `backend/src/config/swagger.ts`.

---

## 🌐 Accessing Swagger UI

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5000/api-docs` |
| Production | `https://api.yourdomain.com/api-docs` |

> **Tip:** Disable Swagger in production if you want to keep API internals private. See the [Production section](#disabling-swagger-in-production) below.

---

## 🔐 Authenticating in Swagger UI

All protected endpoints require a **Firebase ID Token**. To use them in Swagger:

1. Open `http://localhost:5000/api-docs`
2. Click the **"Authorize"** button (🔒 icon, top right)
3. In the **"bearerAuth"** field, paste your Firebase ID Token
4. Click **"Authorize"**, then **"Close"**
5. All subsequent requests will include the `Authorization: Bearer <token>` header automatically

### How to Get a Firebase ID Token for Testing

**Option A — From Browser Console (easiest):**
```javascript
// In your browser console while on the frontend app:
const token = await firebase.auth().currentUser.getIdToken(true);
console.log(token); // Copy this token
```

**Option B — Using Firebase REST API:**
```bash
# Replace with your Firebase API Key and test credentials
curl -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_FIREBASE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword","returnSecureToken":true}'

# Copy the "idToken" field from the response
```

---

## 🛠️ Current Swagger Configuration

File: `backend/src/config/swagger.ts`

```typescript
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'SupportFlow API Documentation',
    version: '1.0.0',
    description: 'RESTful API documentation for SupportFlow multi-tenant customer support platform',
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Development Local Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter Firebase ID Token or JWT Token',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: { ... }
};

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
```

It is registered in `backend/src/app.ts`:
```typescript
import { setupSwagger } from './config/swagger';
setupSwagger(app);
```

---

## 📦 Installed Dependencies

```bash
# Already installed in the project
swagger-ui-express     # Serves Swagger UI
@types/swagger-ui-express  # TypeScript types

# Optional for JSDoc-based schema generation
swagger-jsdoc          # npm install swagger-jsdoc @types/swagger-jsdoc
```

---

## 🚀 Expanding the Swagger Documentation

The current `paths` section is minimal. You can expand it by adding OpenAPI 3.0 path definitions. Here is the full structure for all current endpoints:

### Full OpenAPI 3.0 Paths Reference

Add the following to the `paths` object in `backend/src/config/swagger.ts`:

```typescript
paths: {
  // ── Health ─────────────────────────────────────────
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Health check',
      responses: {
        '200': { description: 'API is healthy' }
      }
    }
  },

  // ── Auth ───────────────────────────────────────────
  '/auth/check-provider': {
    post: {
      tags: ['Auth'],
      summary: 'Check auth provider for email',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: { email: { type: 'string', format: 'email' } }
            }
          }
        }
      },
      responses: { '200': { description: 'Provider info returned' } }
    }
  },

  '/auth/sync': {
    post: {
      tags: ['Auth'],
      summary: 'Register or sync Firebase user to PostgreSQL',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                role: { type: 'string', enum: ['BUSINESS_ADMIN', 'CUSTOMER'] },
                businessName: { type: 'string' },
                fullName: { type: 'string' },
                mode: { type: 'string', enum: ['register', 'login'] }
              }
            }
          }
        }
      },
      responses: { '200': { description: 'User synced successfully' } }
    }
  },

  '/auth/me': {
    get: { tags: ['Auth'], summary: 'Get authenticated user profile', responses: { '200': { description: 'User profile' }, '401': { description: 'Unauthorized' } } }
  },
  '/auth/logout': {
    post: { tags: ['Auth'], summary: 'Logout', responses: { '200': { description: 'Logged out' } } }
  },

  // ── Users ──────────────────────────────────────────
  '/users/businesses': {
    get: { tags: ['Users'], summary: 'Get all active businesses (public)', security: [], responses: { '200': { description: 'Business list' } } }
  },
  '/users/fcm-token': {
    post: {
      tags: ['Users'],
      summary: 'Register FCM push notification token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: {
                token: { type: 'string' },
                deviceType: { type: 'string', enum: ['web', 'android', 'ios'] }
              }
            }
          }
        }
      },
      responses: { '200': { description: 'Token registered' } }
    }
  },
  '/users/profile': {
    patch: {
      tags: ['Users'],
      summary: 'Update user profile',
      responses: { '200': { description: 'Profile updated' } }
    }
  },
  '/users/admin/all': {
    get: { tags: ['Users (Admin)'], summary: 'Get all users [PLATFORM_ADMIN]', responses: { '200': { description: 'User list' }, '403': { description: 'Forbidden' } } }
  },
  '/users/admin/{userId}': {
    delete: {
      tags: ['Users (Admin)'],
      summary: 'Delete user [PLATFORM_ADMIN]',
      parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'User deleted' } }
    }
  },

  // ── Tickets ────────────────────────────────────────
  '/tickets': {
    post: {
      tags: ['Tickets'],
      summary: 'Create a support ticket',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'description'],
              properties: {
                title: { type: 'string', minLength: 3 },
                description: { type: 'string', minLength: 10 },
                category: { type: 'string', enum: ['GENERAL_INQUIRY', 'TECHNICAL_ISSUE', 'BILLING', 'FEATURE_REQUEST', 'BUG_REPORT'] },
                priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
                businessId: { type: 'string' }
              }
            }
          }
        }
      },
      responses: { '201': { description: 'Ticket created' } }
    },
    get: {
      tags: ['Tickets'],
      summary: 'List tickets (role-scoped, paginated)',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'] } },
        { name: 'priority', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] } },
        { name: 'search', in: 'query', schema: { type: 'string' } }
      ],
      responses: { '200': { description: 'Paginated ticket list' } }
    }
  },
  '/tickets/{id}': {
    get: { tags: ['Tickets'], summary: 'Get ticket by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Ticket details' }, '404': { description: 'Not found' } } }
  },
  '/tickets/{id}/status': {
    patch: { tags: ['Tickets'], summary: 'Update ticket status [SA/BA/PA]', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Status updated' } } }
  },
  '/tickets/{id}/assign': {
    patch: { tags: ['Tickets'], summary: 'Assign agent to ticket [SA/BA/PA]', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Agent assigned' } } }
  },
  '/tickets/{id}/notes': {
    post: { tags: ['Tickets'], summary: 'Add internal note [SA/BA/PA]', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Note added' } } }
  },
  '/tickets/{id}/csat': {
    patch: { tags: ['Tickets'], summary: 'Submit CSAT rating [CUSTOMER only]', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'CSAT submitted' } } }
  },

  // ── Invitations ────────────────────────────────────
  '/invitations': {
    post: { tags: ['Invitations'], summary: 'Invite agent [BA]', responses: { '201': { description: 'Invitation sent' } } },
    get: { tags: ['Invitations'], summary: 'Get team + pending invitations [BA]', responses: { '200': { description: 'Team and invitations' } } }
  },
  '/invitations/verify/{token}': {
    get: { tags: ['Invitations'], summary: 'Verify invitation token (public)', security: [], parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Token valid' }, '400': { description: 'Token invalid/expired' } } }
  },
  '/invitations/accept': {
    post: { tags: ['Invitations'], summary: 'Accept invitation (public)', security: [], responses: { '201': { description: 'Account created' } } }
  },
  '/invitations/agents/{agentId}/toggle-active': {
    patch: { tags: ['Invitations'], summary: 'Toggle agent active status [BA]', parameters: [{ name: 'agentId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Status toggled' } } }
  },
  '/invitations/{id}': {
    delete: { tags: ['Invitations'], summary: 'Delete invitation [BA]', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } }
  },

  // ── Notifications ──────────────────────────────────
  '/notifications': {
    get: { tags: ['Notifications'], summary: 'Get my notifications', responses: { '200': { description: 'Notification list' } } }
  },
  '/notifications/read-all': {
    patch: { tags: ['Notifications'], summary: 'Mark all notifications as read', responses: { '200': { description: 'All marked read' } } }
  },
  '/notifications/{id}/read': {
    patch: { tags: ['Notifications'], summary: 'Mark notification as read', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Marked read' } } }
  },

  // ── Subscriptions ──────────────────────────────────
  '/subscriptions/current': {
    get: { tags: ['Subscriptions'], summary: 'Get current subscription + usage', responses: { '200': { description: 'Subscription details' } } }
  },
  '/subscriptions/razorpay-order': {
    post: { tags: ['Subscriptions'], summary: 'Create Razorpay payment order [BA]', responses: { '200': { description: 'Order created' } } }
  },
  '/subscriptions/verify-payment': {
    post: { tags: ['Subscriptions'], summary: 'Verify Razorpay payment [BA]', responses: { '200': { description: 'Payment verified, subscription activated' } } }
  },
  '/subscriptions/cancel': {
    post: { tags: ['Subscriptions'], summary: 'Cancel subscription [BA]', responses: { '200': { description: 'Cancellation scheduled' } } }
  },
  '/subscriptions/downgrade': {
    post: { tags: ['Subscriptions'], summary: 'Schedule plan downgrade [BA]', responses: { '200': { description: 'Downgrade scheduled' } } }
  },
  '/subscriptions/webhook': {
    post: { tags: ['Subscriptions'], summary: 'Razorpay webhook (public, HMAC verified)', security: [], responses: { '200': { description: 'Webhook processed' } } }
  },

  // ── Dashboard ──────────────────────────────────────
  '/dashboard/business': {
    get: { tags: ['Dashboard'], summary: 'Business admin metrics [BA]', responses: { '200': { description: 'Business metrics' } } }
  },
  '/dashboard/agent': {
    get: { tags: ['Dashboard'], summary: 'Agent performance metrics [SA/BA]', responses: { '200': { description: 'Agent metrics' } } }
  },
  '/dashboard/platform': {
    get: { tags: ['Dashboard'], summary: 'Platform admin metrics [PA]', responses: { '200': { description: 'Platform metrics' } } }
  },
  '/dashboard/platform/businesses/{businessId}/toggle-suspend': {
    patch: { tags: ['Dashboard'], summary: 'Toggle business suspension [PA]', parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Suspension toggled' } } }
  },
  '/dashboard/ratings': {
    get: { tags: ['Dashboard'], summary: 'CSAT ratings breakdown [SA/BA]', responses: { '200': { description: 'Ratings data' } } }
  }
}
```

---

## 🚫 Disabling Swagger in Production

To prevent public access to API docs in production, update `swagger.ts`:

```typescript
export const setupSwagger = (app: Express) => {
  if (process.env.NODE_ENV === 'production') {
    // Block access in production
    app.get('/api-docs', (req, res) => res.status(404).json({ message: 'Not found' }));
    return;
  }
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('[Swagger] API Documentation available at /api-docs');
};
```

Or add password protection using a middleware.

---

## 📁 Code Reference

| File | Purpose |
|------|---------|
| `backend/src/config/swagger.ts` | Swagger document definition + UI mount |
| `backend/src/app.ts` | `setupSwagger(app)` registration |
