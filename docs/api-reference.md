# 🌐 SupportFlow — REST API Reference

## Base URL

| Environment | Base URL |
|-------------|----------|
| Development | `http://localhost:5000/api/v1` |
| Production | `https://api.yourdomain.com/api/v1` |
| Swagger UI | `http://localhost:5000/api-docs` |

---

## 🔑 Authentication

All protected endpoints require a **Firebase ID Token** in the `Authorization` header:

```
Authorization: Bearer <Firebase_ID_Token>
```

Tokens expire in 1 hour. Always call `auth.currentUser.getIdToken()` to get a fresh token automatically.

---

## 📐 Standard Response Format

### Success Response
```json
{
  "success": true,
  "message": "Human-readable success message",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

## ✅ HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate email) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

---

# 🔐 Auth Module — `/api/v1/auth`

### POST `/auth/check-provider`
Check if an email is registered and which auth provider is linked.

> Rate limited: 100 requests per 15 minutes

**Request Body:**
```json
{ "email": "user@example.com" }
```

**Response `200`:**
```json
{
  "success": true,
  "message": "User provider checked successfully",
  "data": { "exists": true, "providers": ["EMAIL_PASSWORD"] }
}
```

---

### POST `/auth/sync`
Register a new user or sync a returning user from Firebase. Requires `Authorization: Bearer <token>`.

> Rate limited: 100 requests per 15 minutes

**Headers:** `Authorization: Bearer <Firebase_ID_Token>`

**Request Body (New Business Admin):**
```json
{
  "role": "BUSINESS_ADMIN",
  "businessName": "Acme Corp",
  "fullName": "John Doe",
  "mode": "register"
}
```

**Request Body (New Customer):**
```json
{
  "role": "CUSTOMER",
  "fullName": "Jane Smith",
  "mode": "register"
}
```

**Request Body (Returning User):**
```json
{ "mode": "login" }
```

**Response `200`:**
```json
{
  "success": true,
  "message": "User synchronized successfully",
  "data": {
    "id": "clx...",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "BUSINESS_ADMIN",
    "businessId": "clx...",
    "isActive": true
  }
}
```

---

### GET `/auth/me`
Get the authenticated user's full profile.

**Auth:** Required | **Roles:** All

**Response `200`:**
```json
{
  "success": true,
  "message": "User profile fetched successfully",
  "data": { "id": "clx...", "email": "...", "role": "BUSINESS_ADMIN", ... }
}
```

---

### POST `/auth/logout`
Server-side logout (clears any server-side session data).

**Auth:** Required | **Roles:** All

**Response `200`:**
```json
{ "success": true, "message": "Logged out successfully" }
```

---

### POST `/auth/link-provider`
Link an additional auth provider to the user's account.

**Auth:** Required | **Roles:** All

**Response `200`:**
```json
{ "success": true, "message": "Provider linked successfully" }
```

---

### GET `/auth/providers`
Get all auth providers linked to the authenticated user's Firebase account.

**Auth:** Required | **Roles:** All

**Response `200`:**
```json
{
  "success": true,
  "data": ["EMAIL_PASSWORD", "GOOGLE"]
}
```

---

---

# 👤 Users Module — `/api/v1/users`

### GET `/users/businesses`
Get list of all active businesses (public, no auth required). Used on customer registration page.

**Auth:** Not Required

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "id": "clx...", "businessName": "Acme Corp", "businessId": "clx..." }
  ]
}
```

---

### POST `/users/fcm-token`
Register a Firebase Cloud Messaging device token for push notifications.

**Auth:** Required | **Roles:** All

**Request Body:**
```json
{
  "token": "fcm-device-token-string",
  "deviceType": "web"
}
```

**Response `200`:**
```json
{ "success": true, "message": "FCM push notification token registered successfully" }
```

---

### PATCH `/users/profile`
Update the authenticated user's profile.

**Auth:** Required | **Roles:** All

**Request Body:**
```json
{
  "fullName": "John Updated",
  "phoneNumber": "+91 98765 43210",
  "businessName": "New Business Name"
}
```

**Response `200`:**
```json
{ "success": true, "message": "Profile updated successfully", "data": { ... } }
```

---

### GET `/users/admin/all`
Get all registered platform users.

**Auth:** Required | **Roles:** `PLATFORM_ADMIN`

**Response `200`:**
```json
{
  "success": true,
  "data": [ { "id": "...", "email": "...", "role": "...", ... } ]
}
```

---

### DELETE `/users/admin/:userId`
Permanently delete a user account.

**Auth:** Required | **Roles:** `PLATFORM_ADMIN`

**Response `200`:**
```json
{ "success": true, "message": "User account 'user@example.com' has been deleted successfully." }
```

---

---

# 🎫 Tickets Module — `/api/v1/tickets`

All ticket endpoints require authentication.

### POST `/tickets`
Create a new support ticket.

**Auth:** Required | **Roles:** All

**Request Body:**
```json
{
  "title": "Cannot login to my account",
  "description": "I've been trying to reset my password but the email never arrives.",
  "category": "TECHNICAL_ISSUE",
  "priority": "HIGH",
  "businessId": "clx..."
}
```

> **Enums:**
> - `category`: `GENERAL_INQUIRY` | `TECHNICAL_ISSUE` | `BILLING` | `FEATURE_REQUEST` | `BUG_REPORT` (default: `GENERAL_INQUIRY`)
> - `priority`: `LOW` | `MEDIUM` | `HIGH` | `URGENT` (default: `MEDIUM`)

**Response `201`:**
```json
{
  "success": true,
  "message": "Support ticket created successfully",
  "data": {
    "id": "clx...",
    "ticketNumber": "SF-2026-001",
    "title": "Cannot login to my account",
    "status": "OPEN",
    "priority": "HIGH",
    "category": "TECHNICAL_ISSUE",
    "customerId": "clx...",
    "businessId": "clx...",
    "assignedAgentId": null,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### GET `/tickets`
Get tickets (filtered by role: customers see own tickets, agents see assigned, admins see all).

**Auth:** Required | **Roles:** All

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Results per page |
| `status` | string | — | Filter by status enum |
| `priority` | string | — | Filter by priority enum |
| `category` | string | — | Filter by category enum |
| `search` | string | — | Search in title/description |

**Response `200`:**
```json
{
  "success": true,
  "data": [ { "id": "...", "title": "...", "status": "OPEN", ... } ],
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```

---

### GET `/tickets/:id`
Get a single ticket with full details (messages, timeline, assignee).

**Auth:** Required | **Roles:** All (scoped by role)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "ticketNumber": "SF-2026-001",
    "title": "Cannot login",
    "description": "...",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "messages": [ { "id": "...", "content": "...", "sender": { ... } } ],
    "assignedAgent": { "id": "...", "fullName": "Agent Name" },
    "customer": { "id": "...", "fullName": "Customer Name" }
  }
}
```

---

### PATCH `/tickets/:id/status`
Update a ticket's status.

**Auth:** Required | **Roles:** `SUPPORT_AGENT`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`

**Request Body:**
```json
{
  "status": "IN_PROGRESS"
}
```

> **Status enum:** `OPEN` | `ASSIGNED` | `IN_PROGRESS` | `WAITING_FOR_CUSTOMER` | `RESOLVED` | `CLOSED`

**Response `200`:**
```json
{ "success": true, "message": "Ticket status updated to IN_PROGRESS", "data": { ... } }
```

---

### PATCH `/tickets/:id/assign`
Assign or reassign a support agent to a ticket.

**Auth:** Required | **Roles:** `SUPPORT_AGENT`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`

**Request Body:**
```json
{ "assignedAgentId": "clx..." }
```

**Response `200`:**
```json
{ "success": true, "message": "Support agent assigned successfully", "data": { ... } }
```

---

### POST `/tickets/:id/notes`
Add an internal note to a ticket (hidden from customers).

**Auth:** Required | **Roles:** `SUPPORT_AGENT`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`

**Request Body:**
```json
{ "content": "Escalated to L2 support team." }
```

**Response `201`:**
```json
{ "success": true, "message": "Internal note added successfully", "data": { ... } }
```

---

### PATCH `/tickets/:id/csat`
Submit a Customer Satisfaction (CSAT) rating after ticket resolution.

**Auth:** Required | **Roles:** `CUSTOMER` only

**Request Body:**
```json
{
  "score": 5,
  "comment": "Excellent support! Issue resolved quickly."
}
```

> `score`: Integer between 1–5

**Response `200`:**
```json
{ "success": true, "message": "Feedback submitted successfully", "data": { ... } }
```

---

---

# 📬 Invitations Module — `/api/v1/invitations`

### POST `/invitations`
Invite a support agent to join the business.

**Auth:** Required | **Roles:** `BUSINESS_ADMIN`

**Request Body:**
```json
{
  "email": "agent@company.com",
  "role": "SUPPORT_AGENT"
}
```

> `role`: `SUPPORT_AGENT` | `BUSINESS_ADMIN` (default: `SUPPORT_AGENT`)

**Response `201`:**
```json
{ "success": true, "message": "Invitation sent successfully" }
```

---

### GET `/invitations`
Get team members and pending invitations for the business.

**Auth:** Required | **Roles:** `BUSINESS_ADMIN`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "agents": [ { "id": "...", "fullName": "...", "role": "...", "isActive": true } ],
    "pendingInvitations": [ { "id": "...", "email": "...", "expiresAt": "..." } ]
  }
}
```

---

### PATCH `/invitations/agents/:agentId/toggle-active`
Activate or deactivate an agent's account.

**Auth:** Required | **Roles:** `BUSINESS_ADMIN`

**Response `200`:**
```json
{ "success": true, "message": "Agent status updated successfully" }
```

---

### DELETE `/invitations/:id`
Cancel/delete a pending invitation.

**Auth:** Required | **Roles:** `BUSINESS_ADMIN`

**Response `200`:**
```json
{ "success": true, "message": "Invitation deleted successfully" }
```

---

### GET `/invitations/verify/:token`
Verify an invitation token (public endpoint for the invite acceptance page).

**Auth:** Not Required

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "email": "agent@company.com",
    "role": "SUPPORT_AGENT",
    "businessName": "Acme Corp",
    "expiresAt": "2026-01-08T00:00:00.000Z"
  }
}
```

---

### POST `/invitations/accept`
Accept an invitation and create the agent's account.

**Auth:** Not Required

**Request Body:**
```json
{
  "token": "invitation-token-string",
  "firebaseUid": "firebase-uid-string",
  "fullName": "New Agent",
  "authProvider": "EMAIL_PASSWORD"
}
```

**Response `201`:**
```json
{ "success": true, "message": "Invitation accepted, account created" }
```

---

---

# 🔔 Notifications Module — `/api/v1/notifications`

### GET `/notifications`
Get all notifications for the authenticated user.

**Auth:** Required | **Roles:** All

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "title": "💬 New Customer Message",
      "message": "John: \"Hello I need help...\"",
      "type": "NEW_MESSAGE",
      "isRead": false,
      "ticketId": "clx...",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### PATCH `/notifications/read-all`
Mark all notifications as read for the authenticated user.

**Auth:** Required | **Roles:** All

**Response `200`:**
```json
{ "success": true, "message": "All notifications marked as read" }
```

---

### PATCH `/notifications/:id/read`
Mark a specific notification as read.

**Auth:** Required | **Roles:** All

**Response `200`:**
```json
{ "success": true, "message": "Notification marked as read" }
```

---

---

# 💳 Subscriptions Module — `/api/v1/subscriptions`

### POST `/subscriptions/webhook`
Razorpay webhook handler. Verifies HMAC-SHA256 signature and processes payment events.

**Auth:** Not Required (uses HMAC signature verification)
**Content-Type:** `application/json` (raw body)

> ⚠️ This endpoint is called by Razorpay servers, not by the client.

---

### GET `/subscriptions/current`
Get the current subscription details for the authenticated user's business.

**Auth:** Required | **Roles:** All

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "plan": "STANDARD",
    "billingCycle": "monthly",
    "status": "ACTIVE",
    "currentPeriodStart": "2026-01-01T00:00:00.000Z",
    "currentPeriodEnd": "2026-01-31T00:00:00.000Z",
    "agentsUsed": 2,
    "agentsLimit": 5,
    "ticketsUsed": 47,
    "ticketsLimit": null
  }
}
```

---

### POST `/subscriptions/razorpay-order`
Create a Razorpay order to initiate the checkout modal.

**Auth:** Required | **Roles:** `BUSINESS_ADMIN`

**Request Body:**
```json
{
  "plan": "STANDARD",
  "billingCycle": "monthly"
}
```

> `plan`: `STANDARD` | `BUSINESS`
> `billingCycle`: `monthly` | `yearly`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_xxx",
    "amount": 249900,
    "currency": "INR",
    "key": "rzp_test_xxx"
  }
}
```

---

### POST `/subscriptions/verify-payment`
Verify Razorpay payment after checkout completion.

**Auth:** Required | **Roles:** `BUSINESS_ADMIN`

**Request Body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "hmac-signature",
  "plan": "STANDARD",
  "billingCycle": "monthly"
}
```

**Response `200`:**
```json
{ "success": true, "message": "Payment verified. Subscription activated!" }
```

---

### POST `/subscriptions/cancel`
Cancel the active subscription (downgrades to FREE at period end).

**Auth:** Required | **Roles:** `BUSINESS_ADMIN`

**Response `200`:**
```json
{ "success": true, "message": "Subscription cancelled. You'll retain access until period end." }
```

---

### POST `/subscriptions/downgrade`
Schedule a plan downgrade at the end of the current billing period.

**Auth:** Required | **Roles:** `BUSINESS_ADMIN`

**Request Body:**
```json
{ "targetPlan": "FREE" }
```

> `targetPlan`: `STANDARD` | `FREE`

**Response `200`:**
```json
{ "success": true, "message": "Downgrade scheduled for end of billing period." }
```

---

---

# 📊 Dashboard Module — `/api/v1/dashboard`

All dashboard endpoints require authentication.

### GET `/dashboard/business`
Get business-level metrics and analytics.

**Auth:** Required | **Roles:** `BUSINESS_ADMIN`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalTickets": 150,
    "openTickets": 23,
    "resolvedTickets": 127,
    "averageResolutionTime": "4.2 hours",
    "csatScore": 4.3,
    "agentCount": 3,
    "ticketsByStatus": { ... },
    "ticketsByCategory": { ... },
    "ticketTrend": [ ... ]
  }
}
```

---

### GET `/dashboard/agent`
Get agent-specific performance metrics.

**Auth:** Required | **Roles:** `SUPPORT_AGENT`, `BUSINESS_ADMIN`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "assignedTickets": 8,
    "resolvedThisMonth": 22,
    "avgResolutionTime": "3.1 hours",
    "csatScore": 4.6
  }
}
```

---

### GET `/dashboard/platform`
Get platform-wide statistics for the super admin.

**Auth:** Required | **Roles:** `PLATFORM_ADMIN`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalBusinesses": 45,
    "activeBusinesses": 41,
    "suspendedBusinesses": 4,
    "totalUsers": 312,
    "totalTickets": 8921,
    "subscriptionBreakdown": { "FREE": 30, "STANDARD": 12, "BUSINESS": 3 },
    "businesses": [ { ... } ]
  }
}
```

---

### PATCH `/dashboard/platform/businesses/:businessId/toggle-suspend`
Suspend or reactivate a business account.

**Auth:** Required | **Roles:** `PLATFORM_ADMIN`

**Response `200`:**
```json
{ "success": true, "message": "Business suspended successfully" }
```

---

### GET `/dashboard/ratings`
Get CSAT ratings and feedback for the business.

**Auth:** Required | **Roles:** `SUPPORT_AGENT`, `BUSINESS_ADMIN`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "averageScore": 4.3,
    "totalRatings": 89,
    "distribution": { "5": 45, "4": 28, "3": 10, "2": 4, "1": 2 },
    "recentRatings": [ { "score": 5, "comment": "Excellent!", "ticket": { ... } } ]
  }
}
```
