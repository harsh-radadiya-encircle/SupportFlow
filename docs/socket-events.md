# 📡 SupportFlow — Socket.IO Event Reference

> Verified against `backend/src/socket/socketServer.ts` — the live source of truth.

---

## Connection Setup

**Backend WebSocket URL:**
- Development: `ws://localhost:5000`
- Production: `wss://api.yourdomain.com`

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io(import.meta.env.VITE_SOCKET_URL, {
  transports: ['websocket'],
  withCredentials: true,
});

socket.on('connect', () => {
  console.log('[Socket.IO] Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('[Socket.IO] Disconnected');
});
```

---

## 🏠 Room Naming Convention

| Room Name | Purpose | How to Join |
|-----------|---------|------------|
| `ticket:{ticketId}` | Real-time chat for a specific ticket | emit `join_ticket` |
| `user:{userId}` | Personal room — notifications & presence | emit `join_user_room` |

---

## 📤 CLIENT → SERVER Events (emit)

### `join_user_room`
Join the authenticated user's personal notification room. **Call immediately after login.**

```typescript
// Payload: userId string
socket.emit('join_user_room', user.id);
```

**Side effects:**
- Socket joins `user:{userId}` room
- User's online presence is tracked in `onlineUsers` Map
- `user_status_change` event broadcast to all clients: `{ userId, status: 'online' }`

---

### `join_ticket`
Join a ticket conversation room. **Call when opening a ticket detail page.**

```typescript
// Payload: ticketId string
socket.emit('join_ticket', ticketId);
```

---

### `leave_ticket`
Leave a ticket conversation room. **Call when navigating away from a ticket.**

```typescript
// Payload: ticketId string
socket.emit('leave_ticket', ticketId);
```

---

### `send_message`
Send a real-time chat message in a ticket room.

```typescript
socket.emit('send_message', {
  ticketId: string,   // Target ticket ID
  senderId: string,   // Authenticated user's ID
  content: string,    // Message text (whitespace trimmed server-side)
});
```

**Server-side side effects:**
1. Message saved to `Message` table in PostgreSQL via Prisma
2. `Ticket.updatedAt` bumped to current timestamp
3. `receive_message` broadcast to all sockets in `ticket:{ticketId}` room
4. `new_notification` dispatched to:
   - If sender is **customer** → assigned agent + all business admins get `NEW_MESSAGE` notification
   - If sender is **agent/admin** → customer gets `NEW_MESSAGE` notification

---

### `typing_start`
Notify others in the ticket room that the user has started typing.

```typescript
socket.emit('typing_start', {
  ticketId: string,   // Active ticket ID
  userName: string,   // Display name for typing indicator UI
});
```

---

### `typing_stop`
Notify others in the ticket room that the user stopped typing.

```typescript
socket.emit('typing_stop', {
  ticketId: string,
});
```

---

### `mark_messages_read`
Mark all unread messages in a ticket as read by the current user.

```typescript
socket.emit('mark_messages_read', {
  ticketId: string,   // Ticket to mark as read
  userId: string,     // The reader's user ID
});
```

**Server-side side effects:**
- `Message.isRead = true` set for all messages in `ticketId` NOT sent by `userId` where `isRead = false`
- `messages_read` event broadcast to the ticket room

---

### `check_user_status`
Check if a specific user is currently online (has active socket connection).

```typescript
// Option A — with callback (preferred)
socket.emit('check_user_status', targetUserId, (status: 'online' | 'offline') => {
  console.log(`User ${targetUserId} is ${status}`);
});

// Option B — without callback, listen for user_status event
socket.emit('check_user_status', targetUserId);
socket.on('user_status', ({ userId, status }) => { ... });
```

---

## 📥 SERVER → CLIENT Events (on)

### `receive_message`
Fired when a new message is sent in a ticket room you've joined.

```typescript
socket.on('receive_message', (message: {
  id: string;
  ticketId: string;
  senderId: string;
  type: 'TEXT' | 'ATTACHMENT' | 'SYSTEM';
  content: string;
  attachments: string[];
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    role: 'PLATFORM_ADMIN' | 'BUSINESS_ADMIN' | 'SUPPORT_AGENT' | 'CUSTOMER';
    avatarUrl: string | null;
  };
}) => {
  // Append message to ticket chat UI
});
```

---

### `user_typing_start`
Fired when another user in the ticket room starts typing. **Do NOT fire for the local user's own events.**

```typescript
socket.on('user_typing_start', (data: {
  ticketId: string;
  userName: string;
}) => {
  // Show "Jane is typing..." indicator
});
```

---

### `user_typing_stop`
Fired when another user in the ticket room stops typing.

```typescript
socket.on('user_typing_stop', (data: {
  ticketId: string;
}) => {
  // Hide typing indicator
});
```

---

### `messages_read`
Fired in the ticket room when another user marks messages as read.

```typescript
socket.on('messages_read', (data: {
  ticketId: string;
  readerId: string;   // The user who read the messages
}) => {
  // Update read receipt UI (show double-tick, etc.)
});
```

---

### `user_status_change`
Broadcast to **all** connected clients when any user comes online or goes offline.

```typescript
socket.on('user_status_change', (data: {
  userId: string;
  status: 'online' | 'offline';
}) => {
  // Update online/offline presence indicator
});
```

---

### `user_status`
Response to `check_user_status` when called **without a callback**.

```typescript
socket.on('user_status', (data: {
  userId: string;
  status: 'online' | 'offline';
}) => { ... });
```

---

### `new_notification`
Fired in the user's personal room (`user:{userId}`) when a new notification is created. Subscribe to this after calling `join_user_room`.

```typescript
socket.on('new_notification', (notification: {
  id: string;
  userId: string;
  ticketId: string | null;
  title: string;
  message: string;
  isRead: boolean;
  type: NotificationType;
  createdAt: string;
}) => {
  // Show toast/bell badge, add to notification list
});
```

---

## 🔔 Notification Types (`type` field)

| Type | Trigger | Who Receives |
|------|---------|-------------|
| `NEW_TICKET` | New ticket created in business | Business Admins |
| `TICKET_ASSIGNED` | Ticket assigned to an agent | Assigned Agent |
| `NEW_MESSAGE` | New chat message in a ticket | Agent (if customer sent) or Customer (if agent sent) |
| `STATUS_CHANGED` | Ticket status updated | Customer of the ticket |
| `TICKET_RESOLVED` | Ticket resolved | Customer of the ticket |
| `CSAT_RECEIVED` | Customer submits CSAT rating | Assigned Agent + Business Admins |
| `PLAN_PURCHASED` | Subscription payment successful | Business Admins |
| `PLAN_UPGRADED` | Plan upgraded to higher tier | Business Admins |
| `PLAN_DOWNGRADED` | Plan downgrade scheduled | Business Admins |
| `PLAN_CANCELED` | Subscription cancelled | Business Admins |
| `PLAN_CHANGED` | Plan auto-changed (period expired) | Business Admins |
| `PLAN_PAST_DUE` | Payment past due | Business Admins |
| `PLAN_PAYMENT_FAILED` | Razorpay payment failed | Business Admins |
| `URGENT_TICKET` | New URGENT priority ticket | Business Admins |
| `SYSTEM` | Generic system notification | Varies |

---

## 📋 Complete Event Map

```
CLIENT emits                        SERVER handles
──────────────────────────────────────────────────────
join_user_room(userId)          →   Joins user:{userId} room, tracks presence
join_ticket(ticketId)           →   Joins ticket:{ticketId} room
leave_ticket(ticketId)          →   Leaves ticket:{ticketId} room
send_message({...})             →   Saves to DB, broadcasts receive_message + new_notification
typing_start({ticketId, name})  →   Broadcasts user_typing_start to room
typing_stop({ticketId})         →   Broadcasts user_typing_stop to room
mark_messages_read({...})       →   Updates DB isRead, broadcasts messages_read
check_user_status(userId, cb)   →   Calls callback OR emits user_status

SERVER emits                        CLIENT receives
──────────────────────────────────────────────────────
receive_message(message)        →   New chat message in ticket room
user_typing_start(data)         →   Typing indicator ON
user_typing_stop(data)          →   Typing indicator OFF
messages_read(data)             →   Read receipts updated
user_status_change(data)        →   Online/offline presence change (broadcast)
user_status(data)               →   Response to check_user_status (no-callback variant)
new_notification(notification)  →   Real-time notification in user room
```

---

## 💡 Implementation Tips

### Prevent Typing Indicator from Firing for Self

```typescript
socket.on('user_typing_start', ({ ticketId, userName }) => {
  // The server uses socket.to() which excludes the sender
  // so you won't receive your own typing events
  showTypingIndicator(userName);
});
```

### Debounce Typing Events

```typescript
import { useDebounce } from '@/shared/hooks/useDebounce';

// Emit typing_start on keystroke, typing_stop after 1.5s of silence
const handleTyping = () => {
  socket.emit('typing_start', { ticketId, userName: user.fullName });
};

const handleTypingStop = useDebounce(() => {
  socket.emit('typing_stop', { ticketId });
}, 1500);
```

### Clean Up on Component Unmount

```typescript
useEffect(() => {
  socket.emit('join_ticket', ticketId);

  return () => {
    socket.emit('leave_ticket', ticketId);
    socket.emit('typing_stop', { ticketId });
  };
}, [ticketId]);
```
