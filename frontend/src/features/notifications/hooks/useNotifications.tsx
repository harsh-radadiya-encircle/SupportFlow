import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocketStore } from '../../../shared/store/socketStore';
import toast from 'react-hot-toast';
import { notificationsApi } from '../api/notifications.api';
import { useAuthStore } from '../../../shared/store/authStore';

/**
 * Web Audio API Chime Synthesizer (No external audio file needed!)
 */
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.45);
  } catch (err) {
    // Ignore audio autoplay restrictions
  }
};

export const useSetupNotificationSocket = () => {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const { connect } = useSocketStore();

  useEffect(() => {
    if (!user || !isAuthenticated) return;

    const socket = connect(user.id);
    if (!socket) return;

    const handleNewNotification = (notification: any) => {
      // 1. Play real-time notification chime
      playNotificationChime();

      // 2. Invalidate TanStack Query caches for real-time UI refetch without page refresh!
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      // 3. Show live Toast Alert
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 border border-indigo-100 font-sans p-4 space-x-3`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
              🔔
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-xs font-bold text-slate-900">
                {notification.title || 'New Notification'}
              </p>
              <p className="text-xs text-slate-600 font-medium leading-normal">
                {notification.message}
              </p>
            </div>
          </div>
        ),
        { duration: 5000 }
      );
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [user, isAuthenticated, queryClient, connect]);
};

export const useNotifications = () => {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getNotifications,
    enabled: isAuthenticated && Boolean(user),
    staleTime: 5000,
    retry: 1,
    refetchInterval: (query) => (query.state.status === 'error' ? false : 10000),
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
