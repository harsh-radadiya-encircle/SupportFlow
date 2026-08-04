# 🗄️ SupportFlow — Entity Relationship (ER) Diagram

> Generated from `backend/prisma/schema.prisma` — the single source of truth for the database.

---

## 📊 ER Diagram (Mermaid)

```mermaid
erDiagram

    User {
        String  id            PK "uuid"
        String  firebaseUid   UK "unique"
        String  email         UK "unique"
        String  fullName
        String  phoneNumber   "nullable"
        String  avatarUrl     "nullable"
        Role    role          "PLATFORM_ADMIN | BUSINESS_ADMIN | SUPPORT_AGENT | CUSTOMER"
        AuthProvider authProvider "EMAIL_PASSWORD | GOOGLE | MULTI_PROVIDER"
        Boolean isActive      "default: true"
        String  businessId    FK "nullable → Business"
        DateTime createdAt
        DateTime updatedAt
    }

    Business {
        String           id                     PK "uuid"
        String           name
        String           slug                   UK "unique"
        String           logoUrl                "nullable"
        Boolean          isSuspended            "default: false"
        String           razorpayCustomerId     UK "nullable"
        String           razorpaySubscriptionId UK "nullable"
        String           razorpayOrderId        "nullable"
        SubscriptionPlan plan                   "FREE | STANDARD | BUSINESS"
        SubscriptionStatus subscriptionStatus   "ACTIVE | PAST_DUE | CANCELED | TRIALING | INCOMPLETE"
        DateTime         currentPeriodEnd       "nullable"
        String           billingCycle           "nullable — monthly|yearly"
        Boolean          cancelAtPeriodEnd      "default: false"
        SubscriptionPlan pendingDowngradePlan   "nullable"
        DateTime         lastPaymentAt          "nullable"
        DateTime         nextBillingDate        "nullable"
        DateTime         createdAt
        DateTime         updatedAt
    }

    Ticket {
        String         id              PK "uuid"
        Int            ticketNumber    "auto-increment"
        String         title
        String         description
        TicketCategory category        "GENERAL_INQUIRY | TECHNICAL_ISSUE | BILLING | FEATURE_REQUEST | BUG_REPORT"
        TicketPriority priority        "LOW | MEDIUM | HIGH | URGENT"
        TicketStatus   status          "OPEN | ASSIGNED | IN_PROGRESS | WAITING_FOR_CUSTOMER | RESOLVED | CLOSED"
        Int            csatScore       "nullable 1-5"
        String         csatComment     "nullable"
        String         businessId      FK "→ Business"
        String         customerId      FK "→ User"
        String         assignedAgentId FK "nullable → User"
        DateTime       firstResponseAt "nullable"
        DateTime       resolvedAt      "nullable"
        DateTime       closedAt        "nullable"
        DateTime       createdAt
        DateTime       updatedAt
    }

    Message {
        String      id          PK "uuid"
        String      ticketId    FK "→ Ticket"
        String      senderId    FK "→ User"
        MessageType type        "TEXT | ATTACHMENT | SYSTEM"
        String      content
        String[]    attachments "array of URLs"
        Boolean     isRead      "default: false"
        DateTime    createdAt
    }

    InternalNote {
        String   id        PK "uuid"
        String   ticketId  FK "→ Ticket"
        String   authorId  FK "→ User"
        String   content
        DateTime createdAt
    }

    TicketActivity {
        String   id        PK "uuid"
        String   ticketId  FK "→ Ticket"
        String   actorId   FK "nullable → User"
        String   action
        Json     details
        DateTime createdAt
    }

    Notification {
        String   id        PK "uuid"
        String   userId    FK "→ User"
        String   ticketId  FK "nullable → Ticket"
        String   title
        String   message
        Boolean  isRead    "default: false"
        String   type
        DateTime createdAt
    }

    FcmToken {
        String   id         PK "uuid"
        String   userId     FK "→ User"
        String   token      UK "unique FCM device token"
        String   deviceType "nullable — web|android|ios"
        DateTime createdAt
        DateTime updatedAt
    }

    Invitation {
        String   id          PK "uuid"
        String   email
        String   token       UK "unique secure token"
        Role     role        "default: SUPPORT_AGENT"
        String   businessId  FK "→ Business"
        String   invitedById FK "→ User"
        Boolean  isAccepted  "default: false"
        DateTime expiresAt   "token expiry"
        DateTime createdAt
    }

    BillingHistory {
        String           id                PK "uuid"
        String           businessId        FK "→ Business"
        String           invoiceNumber     "nullable — SF-YYYYMM-XXXX"
        String           razorpayPaymentId UK "unique"
        String           razorpayOrderId   "nullable"
        Int              amountPaid        "in paise (INR)"
        String           currency          "default: INR"
        String           status            "captured | failed | refunded"
        SubscriptionPlan planAtPayment     "nullable"
        String           billingCycle      "nullable"
        String           paymentMethod     "nullable"
        String           pdfUrl            "nullable"
        DateTime         createdAt
    }

    WebhookEvent {
        String   id          PK "uuid"
        String   eventId     UK "Razorpay event ID — idempotency key"
        String   eventType   "e.g. order.paid"
        String   businessId  FK "nullable → Business"
        Json     payload     "full Razorpay event payload"
        DateTime processedAt
    }

    User        ||--o{ Ticket         : "creates (CUSTOMER)"
    User        ||--o{ Ticket         : "assigned to (SUPPORT_AGENT)"
    User        ||--o{ Message        : "sends"
    User        ||--o{ InternalNote   : "authors"
    User        ||--o{ TicketActivity : "performs"
    User        ||--o{ Notification   : "receives"
    User        ||--o{ FcmToken       : "has"
    User        ||--o{ Invitation     : "sends (invitedBy)"
    User        }o--|| Business       : "belongs to"

    Business    ||--o{ Ticket         : "owns"
    Business    ||--o{ Invitation     : "sends"
    Business    ||--o{ BillingHistory : "has"
    Business    ||--o{ WebhookEvent   : "receives"

    Ticket      ||--o{ Message        : "has"
    Ticket      ||--o{ InternalNote   : "has"
    Ticket      ||--o{ TicketActivity : "logs"
    Ticket      ||--o{ Notification   : "triggers"
```

---

## 📋 Table Summary

| Table | Rows Description | Key Relationships |
|-------|-----------------|-------------------|
| `User` | All users across all roles | Belongs to Business, creates/assigned Tickets |
| `Business` | Multi-tenant business accounts | Owns Tickets, Invitations, BillingHistory |
| `Ticket` | Customer support tickets | Belongs to Business + Customer, optional Agent |
| `Message` | Real-time chat messages in tickets | Belongs to Ticket + Sender |
| `InternalNote` | Agent-only notes (hidden from customers) | Belongs to Ticket + Author |
| `TicketActivity` | Audit trail of ticket events | Belongs to Ticket + Actor |
| `Notification` | In-app notifications | Belongs to User + optional Ticket |
| `FcmToken` | Firebase push notification device tokens | Belongs to User |
| `Invitation` | Pending agent invitations (with expiry) | Belongs to Business + InvitedBy |
| `BillingHistory` | Payment invoice records | Belongs to Business |
| `WebhookEvent` | Idempotency store for Razorpay webhooks | Optionally linked to Business |

---

## 🔑 Enums

### `Role`
| Value | Description |
|-------|-------------|
| `PLATFORM_ADMIN` | Global platform administrator |
| `BUSINESS_ADMIN` | Owner/admin of a business |
| `SUPPORT_AGENT` | Support team member |
| `CUSTOMER` | End user who creates tickets |

### `SubscriptionPlan`
| Value | Agents | Tickets/mo | Monthly Price |
|-------|--------|-----------|---------------|
| `FREE` | 1 | 25 | ₹0 |
| `STANDARD` | 5 | Unlimited | ₹2,499 |
| `BUSINESS` | 20 | Unlimited | ₹6,499 |

### `SubscriptionStatus`
`ACTIVE` | `PAST_DUE` | `CANCELED` | `TRIALING` | `INCOMPLETE`

### `TicketStatus`
`OPEN` → `ASSIGNED` → `IN_PROGRESS` → `WAITING_FOR_CUSTOMER` → `RESOLVED` → `CLOSED`

### `TicketPriority`
`LOW` | `MEDIUM` | `HIGH` | `URGENT`

### `TicketCategory`
`GENERAL_INQUIRY` | `TECHNICAL_ISSUE` | `BILLING` | `FEATURE_REQUEST` | `BUG_REPORT`

### `MessageType`
`TEXT` | `ATTACHMENT` | `SYSTEM`

### `AuthProvider`
`EMAIL_PASSWORD` | `GOOGLE` | `MULTI_PROVIDER`

---

## 📍 Key Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `User` | `(firebaseUid)` | Token verification on every request |
| `User` | `(businessId, role)` | Filter agents/admins per business |
| `User` | `(role, isActive)` | Active agent count for plan limits |
| `Business` | `(plan, subscriptionStatus)` | Subscription management queries |
| `Business` | `(isSuspended)` | Suspension check |
| `Business` | `(currentPeriodEnd)` | Expiry cron job |
| `Ticket` | `(businessId, status)` | Business admin ticket listing |
| `Ticket` | `(businessId, createdAt)` | Dashboard date-range queries |
| `Ticket` | `(customerId, status)` | Customer's own ticket listing |
| `Ticket` | `(assignedAgentId, status)` | Agent's assigned ticket listing |
| `Message` | `(ticketId, createdAt)` | Chronological chat history |
| `Notification` | `(userId, isRead)` | Unread notification count |
| `Notification` | `(userId, createdAt)` | User notification list |
| `Invitation` | `(businessId, isAccepted)` | Pending invites per business |
| `BillingHistory` | `(businessId, createdAt)` | Billing history listing |
| `WebhookEvent` | `(eventId)` | Idempotency duplicate check |

---

## 🛠️ Useful Prisma Commands

```bash
# Open Prisma Studio (visual ER browser)
cd backend && npx prisma studio

# Generate DB diagram image (requires prisma-erd-generator)
npx prisma generate

# View current migration status
npx prisma migrate status

# Create a new migration after schema changes
npx prisma migrate dev --name describe_your_change

# Deploy migrations to production
npx prisma migrate deploy
```
