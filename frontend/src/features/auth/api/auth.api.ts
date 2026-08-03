import { apiClient } from '../../../shared/api/apiClient';
import { Role } from '../../../shared/types';

export interface SyncPayload {
  firebaseUid: string;
  email: string;
  fullName?: string;
  role?: Role;
  businessName?: string;
  mode?: 'login' | 'register';
}

export const authApi = {
  checkProvider: async (email: string) => {
    const response = await apiClient.post('/auth/check-provider', { email });
    return response.data;
  },

  syncUser: async (payload: Omit<SyncPayload, 'firebaseUid' | 'email'>, idToken: string) => {
    const response = await apiClient.post('/auth/sync', payload, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  linkProvider: async () => {
    const response = await apiClient.post('/auth/link-provider');
    return response.data;
  },
};
