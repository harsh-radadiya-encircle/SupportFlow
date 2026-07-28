import { apiClient } from '../../../shared/api/apiClient';

export const ticketsApi = {
  getTickets: async (params?: Record<string, any>) => {
    const response = await apiClient.get('/tickets', { params });
    return response.data;
  },

  getTicketById: async (id: string) => {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  },

  createTicket: async (payload: any) => {
    const response = await apiClient.post('/tickets', payload);
    return response.data;
  },

  sendMessage: async (ticketId: string, content: string) => {
    const response = await apiClient.post(`/tickets/${ticketId}/messages`, { content });
    return response.data;
  },

  addInternalNote: async (ticketId: string, content: string) => {
    const response = await apiClient.post(`/tickets/${ticketId}/notes`, { content });
    return response.data;
  },
};
