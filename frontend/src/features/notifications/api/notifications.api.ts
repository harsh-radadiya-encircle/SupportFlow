import { apiClient } from '../../../shared/api/apiClient';

export const notificationsApi = {
  getNotifications: async () => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  },
};
