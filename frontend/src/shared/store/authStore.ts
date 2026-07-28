import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
}

const initialToken = localStorage.getItem('supportflow_token');
const initialUserJson = localStorage.getItem('supportflow_user');
const initialUser: User | null = initialUserJson ? JSON.parse(initialUserJson) : null;

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: Boolean(initialToken && initialUser),
  isLoading: false,

  setAuth: (user: User, token: string) => {
    localStorage.setItem('supportflow_token', token);
    localStorage.setItem('supportflow_user', JSON.stringify(user));
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearAuth: () => {
    localStorage.removeItem('supportflow_token');
    localStorage.removeItem('supportflow_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
