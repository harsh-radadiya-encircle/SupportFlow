import { apiClient } from '../../../shared/api/apiClient';

export interface UserItem {
  id: string;
  firebaseUid: string;
  email: string;
  fullName: string;
  role: 'PLATFORM_ADMIN' | 'BUSINESS_ADMIN' | 'SUPPORT_AGENT' | 'CUSTOMER';
  authProvider: string;
  isActive: boolean;
  createdAt: string;
  businessName: string;
  createdTicketsCount: number;
  assignedTicketsCount: number;
}

export const usersApi = {
  getAllUsers: async (): Promise<UserItem[]> => {
    const response = await apiClient.get('/users/admin/all');
    return response.data.data;
  },

  deleteUser: async (userId: string) => {
    const response = await apiClient.delete(`/users/admin/${userId}`);
    return response.data;
  },

  updateProfile: async (data: { fullName?: string; phoneNumber?: string; businessName?: string }) => {
    const response = await apiClient.patch('/users/profile', data);
    return response.data;
  },
};
