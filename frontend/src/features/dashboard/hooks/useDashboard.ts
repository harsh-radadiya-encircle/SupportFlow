import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import { useAuthStore } from '../../../shared/store/authStore';

export const useBusinessDashboard = (params?: { startDate?: string; endDate?: string }) => {
  const { user, token } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard', 'business', params],
    queryFn: () => dashboardApi.getBusinessMetrics(params),
    enabled: Boolean(user) && Boolean(token),
    retry: 1,
    refetchInterval: (q) => (q.state.status === 'error' ? false : 30000),
  });
};

export const useAgentDashboard = () => {
  const { user, token } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard', 'agent'],
    queryFn: () => dashboardApi.getAgentMetrics(),
    enabled: Boolean(user) && Boolean(token),
    retry: 1,
    refetchInterval: (q) => (q.state.status === 'error' ? false : 20000),
  });
};

export const usePlatformDashboard = () => {
  const { user, token } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard', 'platform'],
    queryFn: () => dashboardApi.getPlatformMetrics(),
    enabled: Boolean(user) && Boolean(token),
    retry: 1,
    refetchInterval: (q) => (q.state.status === 'error' ? false : 30000),
  });
};
