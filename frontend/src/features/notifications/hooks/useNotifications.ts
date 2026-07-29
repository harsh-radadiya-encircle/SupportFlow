import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { notificationsApi } from '../api/notifications.api';
import { useAuthStore } from '../../../shared/store/authStore';

export const useNotifications = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const socket = io('http://localhost:5000', {
      withCredentials: true,
    });

    socket.emit('join_user_room', user.id);

    socket.on('new_notification', (notification: any) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`🔔 ${notification.title}: ${notification.message}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getNotifications,
    staleTime: 5000,
    refetchInterval: 15000, // Background polling fallback
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read.');
    },
  });
};
