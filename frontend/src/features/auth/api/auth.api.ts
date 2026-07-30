import { apiClient } from '../../../shared/api/apiClient';
import { Role } from '../../../shared/types';

export interface SyncPayload {
  firebaseUid: string;
  email: string;
  fullName?: string;
  role?: Role;
  businessName?: string;
  mode?: 'login' | 'register';
  authProvider?: 'EMAIL_PASSWORD' | 'GOOGLE' | 'MULTI_PROVIDER';
}

export const authApi = {
  checkProvider: async (email: string) => {
    const response = await apiClient.post('/auth/check-provider', { email });
    return response.data;
  },

  syncUser: async (payload: SyncPayload) => {
    const response = await apiClient.post('/auth/sync', payload);
    return response.data;
  },

  syncPassword: async (payload: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/sync-password', payload);
    return response.data;
  },

  getCustomToken: async () => {
    const response = await apiClient.get('/auth/custom-token');
    return response.data;
  },

  register: async (payload: SyncPayload) => {
    const response = await apiClient.post('/auth/sync', { ...payload, mode: 'register' });
    return response.data;
  },

  login: async (idTokenOrEmail: string) => {
    const response = await apiClient.post('/auth/sync', { mode: 'login' });
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
