import { apiClient } from '../../../shared/api/apiClient';

export const dashboardApi = {
  getBusinessStats: async () => {
    const response = await apiClient.get('/dashboard/business');
    return response.data;
  },

  getPlatformStats: async () => {
    const response = await apiClient.get('/dashboard/platform');
    return response.data;
  },

  getAgentStats: async () => {
    const response = await apiClient.get('/dashboard/agent');
    return response.data;
  },
};
