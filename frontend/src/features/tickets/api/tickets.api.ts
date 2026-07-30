import { apiClient } from '../../../shared/api/apiClient';

export interface CreateTicketPayload {
  title: string;
  description: string;
  category?: string;
  priority?: string;
  businessId?: string;
}

export interface TicketFilterQuery {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const ticketsApi = {
  createTicket: async (payload: CreateTicketPayload) => {
    const response = await apiClient.post('/tickets', payload);
    return response.data;
  },

  getTickets: async (query?: TicketFilterQuery) => {
    const response = await apiClient.get('/tickets', { params: query });
    return response.data;
  },

  getTicketById: async (id: string) => {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/tickets/${id}/status`, { status });
    return response.data;
  },

  assignAgent: async (id: string, assignedAgentId: string) => {
    const response = await apiClient.patch(`/tickets/${id}/assign`, { assignedAgentId });
    return response.data;
  },

  addInternalNote: async (id: string, content: string) => {
    const response = await apiClient.post(`/tickets/${id}/notes`, { content });
    return response.data;
  },

  submitCsat: async (id: string, score: number, comment?: string) => {
    const response = await apiClient.patch(`/tickets/${id}/csat`, { score, comment });
    return response.data;
  },
};
