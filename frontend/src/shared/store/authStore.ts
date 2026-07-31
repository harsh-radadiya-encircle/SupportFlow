import { create } from 'zustand';
import { User } from '../types';
import { useSocketStore } from './socketStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  updateUserBusinessPlan: (plan: string) => void;
  updateUserProfile: (data: { fullName: string; phoneNumber?: string | null }) => void;
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
    
    // Disconnect the shared Socket.IO connection on logout
    useSocketStore.getState().disconnect();

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),

  updateUserBusinessPlan: (plan: string) => {
    set((state) => {
      if (!state.user || !state.user.business) return state;
      const updatedUser = {
        ...state.user,
        business: {
          ...state.user.business,
          plan: plan as any,
        },
      };
      localStorage.setItem('supportflow_user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },

  updateUserProfile: (data) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = {
        ...state.user,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : state.user.phoneNumber,
      };
      localStorage.setItem('supportflow_user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));
