import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export const useBusinessDashboard = () => {
  return useQuery({
    queryKey: ['dashboard', 'business'],
    queryFn: () => dashboardApi.getBusinessMetrics(),
    refetchInterval: 30000, // Auto-refresh metrics every 30 seconds
  });
};
