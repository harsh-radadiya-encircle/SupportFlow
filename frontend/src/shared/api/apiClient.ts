import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('supportflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRedirectingToLogin = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: any[] }>) => {
    const backendMessage = error.response?.data?.message;
    const statusCode = error.response?.status;

    if (statusCode === 500) {
      toast.error(
        `Server Error (500): ${backendMessage || 'An unexpected internal server error occurred.'}`
      );
    } else if (statusCode === 401) {
      localStorage.removeItem('supportflow_token');
      localStorage.removeItem('supportflow_user');

      if (
        !isRedirectingToLogin &&
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/'
      ) {
        isRedirectingToLogin = true;
        useAuthStore.getState().clearAuth();
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
