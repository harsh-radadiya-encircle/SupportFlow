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
}

export const dashboardApi = {
  getBusinessMetrics: async (): Promise<DashboardMetricsResponse> => {
    const response = await apiClient.get('/dashboard/business');
    return response.data.data;
  },
};
