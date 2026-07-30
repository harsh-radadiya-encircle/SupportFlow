export type Role = 'PLATFORM_ADMIN' | 'BUSINESS_ADMIN' | 'SUPPORT_AGENT' | 'CUSTOMER';

export type SubscriptionPlan = 'FREE' | 'STANDARD' | 'BUSINESS';

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'INCOMPLETE';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketCategory =
  | 'GENERAL_INQUIRY'
  | 'TECHNICAL_ISSUE'
  | 'BILLING'
  | 'FEATURE_REQUEST'
  | 'BUG_REPORT';

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: Role;
  authProvider?: 'EMAIL_PASSWORD' | 'GOOGLE' | 'MULTI_PROVIDER';
  isActive: boolean;
  businessId?: string | null;
  business?: Business | null;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isSuspended: boolean;
  plan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd?: string | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: number;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  businessId: string;
  business?: Business;
  customerId: string;
  customer?: User;
  assignedAgentId?: string | null;
  assignedAgent?: User | null;
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
}

export interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  sender?: User;
  type: 'TEXT' | 'ATTACHMENT' | 'SYSTEM';
  content: string;
  attachments: string[];
  isRead: boolean;
  createdAt: string;
}

export interface InternalNote {
  id: string;
  ticketId: string;
  authorId: string;
  author?: User;
  content: string;
  createdAt: string;
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  actorId?: string | null;
  actor?: User | null;
  action: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  ticketId?: string | null;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}
