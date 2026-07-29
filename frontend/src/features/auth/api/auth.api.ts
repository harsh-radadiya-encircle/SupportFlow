import { apiClient } from '../../../shared/api/apiClient';
import { Role } from '../../../shared/types';

export interface SyncPayload {
  firebaseUid: string;
  email: string;
  fullName: string;
  role?: Role;
  businessName?: string;
  mode?: 'login' | 'register';
  authProvider?: 'EMAIL_PASSWORD' | 'GOOGLE';
}

export const authApi = {
  syncUser: async (payload: SyncPayload) => {
    const response = await apiClient.post('/auth/sync', payload);
    return response.data;
  },

  login: async (email: string) => {
    const response = await apiClient.post('/auth/login', { email });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password?: string) => {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};
