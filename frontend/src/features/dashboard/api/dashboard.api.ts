import { apiClient } from '../../../shared/api/apiClient';

export interface DashboardMetricsResponse {
  summary: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    avgResponseTime: string;
    avgResolutionTime: string;
    resolutionRate: number;
  };
  ticketsByPriority: {
    URGENT: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  ticketsByStatus: {
    OPEN: number;
    ASSIGNED: number;
    IN_PROGRESS: number;
    WAITING_FOR_CUSTOMER: number;
    RESOLVED: number;
    CLOSED: number;
  };
  ticketsByCategory?: {
    GENERAL_INQUIRY: number;
    TECHNICAL_ISSUE: number;
    BILLING: number;
    FEATURE_REQUEST: number;
    BUG_REPORT: number;
  };
  agentWorkload: Array<{
    id: string;
    fullName: string;
    email: string;
    activeTickets: number;
    resolvedTickets: number;
    totalAssigned: number;
  }>;
  recentTickets: Array<{
    id: string;
    ticketNumber?: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    customer?: {
      id: string;
      fullName: string;
      email: string;
    };
    assignedAgent?: {
      id: string;
      fullName: string;
    };
  }>;
  timeline?: Array<{
    date: string;
    Created: number;
    Resolved: number;
  }>;
}

export interface AgentMetricsResponse {
  summary: {
    assignedTickets: number;
    openTickets: number;
    waitingTickets: number;
    resolvedTickets: number;
  };
  recentMessages: Array<{
    id: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      fullName: string;
      role: string;
    };
    ticket: {
      id: string;
      ticketNumber?: string;
      title: string;
    };
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    ticketId?: string;
  }>;
}

export interface PlatformAdminMetricsResponse {
  summary: {
    totalBusinesses: number;
    activeSubscriptions: number;
    monthlyRevenue: string;
    mrrNumber: number;
    suspendedBusinesses: number;
  };
  businessesByPlan: {
    FREE: number;
    STANDARD: number;
    BUSINESS: number;
  };
  businesses: Array<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    subscriptionStatus: string;
    isSuspended: boolean;
    createdAt: string;
    usersCount: number;
    ticketsCount: number;
    ownerName: string;
    ownerEmail: string;
  }>;
}

export const dashboardApi = {
  getBusinessMetrics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardMetricsResponse> => {
    const response = await apiClient.get('/dashboard/business', { params });
    return response.data.data;
  },

  getAgentMetrics: async (): Promise<AgentMetricsResponse> => {
    const response = await apiClient.get('/dashboard/agent');
    return response.data.data;
  },

  getPlatformMetrics: async (): Promise<PlatformAdminMetricsResponse> => {
    const response = await apiClient.get('/dashboard/platform');
    return response.data.data;
  },

  toggleBusinessSuspension: async (businessId: string) => {
    const response = await apiClient.patch(
      `/dashboard/platform/businesses/${businessId}/toggle-suspend`
    );
    return response.data;
  },
};
