import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { useSocketStore } from '../../../shared/store/socketStore';
import toast from 'react-hot-toast';
import { ticketsApi, CreateTicketPayload, TicketFilterQuery } from '../api/tickets.api';
import { apiClient } from '../../../shared/api/apiClient';
import { useAuthStore } from '../../../shared/store/authStore';

export const useActiveBusinesses = () => {
  return useQuery({
    queryKey: ['activeBusinesses'],
    queryFn: async () => {
      const response = await apiClient.get('/users/businesses');
      return response.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useTickets = (query?: TicketFilterQuery) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['tickets', query],
    queryFn: () => ticketsApi.getTickets(query),
    enabled: isAuthenticated,
    staleTime: 10 * 1000,
    retry: 1,
    refetchInterval: (q) => (q.state.status === 'error' ? false : 15 * 1000),
  });
};

export const useTicketDetail = (id: string) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getTicketById(id),
    enabled: isAuthenticated && Boolean(id),
    retry: 1,
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => ticketsApi.createTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Support ticket created successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create ticket.';
      toast.error(msg);
    },
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ticketsApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success(`Ticket status updated to ${variables.status}`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update ticket status.';
      toast.error(msg);
    },
  });
};

export const useAssignTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignedAgentId }: { id: string; assignedAgentId: string }) =>
      ticketsApi.assignAgent(id, assignedAgentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Support agent assigned successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to assign agent.';
      toast.error(msg);
    },
  });
};

export const useAddInternalNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      ticketsApi.addInternalNote(id, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.id] });
      toast.success('Internal note added successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to add internal note.';
      toast.error(msg);
    },
  });
};

export const useSubmitCsat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, score, comment }: { id: string; score: number; comment?: string }) =>
      ticketsApi.submitCsat(id, score, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.id] });
      toast.success('Thank you for your feedback!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to submit feedback.';
      toast.error(msg);
    },
  });
};

/**
 * Custom Socket.IO Chat & Live Synchronization Hook
 */
export const useSocketChat = (ticketId: string, targetUserId?: string | null) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { connect } = useSocketStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [participantStatus, setParticipantStatus] = useState<'online' | 'offline'>('offline');

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastEmitTypingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!ticketId || !user) return;

    const socketInstance = connect(user.id);
    if (!socketInstance) return;

    setSocket(socketInstance);

    // Join Ticket Room and automatically mark existing messages as read
    socketInstance.emit('join_ticket', ticketId);
    socketInstance.emit('mark_messages_read', { ticketId, userId: user.id });

    // Request initial online status of target participant
    if (targetUserId) {
      socketInstance.emit('check_user_status', targetUserId, (status: 'online' | 'offline') => {
        setParticipantStatus(status);
      });
    }

    const handleReceiveMessage = (newMsg: any) => {
      setMessages((prev) => [...prev, newMsg]);

      // If viewing active room and message is from someone else, instantly mark as read
      if (newMsg.senderId !== user.id) {
        socketInstance.emit('mark_messages_read', { ticketId, userId: user.id });
      }
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    };

    const handleMessagesRead = (data: { ticketId: string; readerId: string }) => {
      if (data.ticketId === ticketId && data.readerId !== user.id) {
        // Mark all our sent messages as read in local state for instant UI update
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId === user.id ? { ...msg, isRead: true } : msg
          )
        );
        // Force refresh data query to retrieve updated isRead states from DB
        queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      }
    };

    const handleUserStatusChange = (data: { userId: string; status: 'online' | 'offline' }) => {
      if (targetUserId && data.userId === targetUserId) {
        setParticipantStatus(data.status);
      }
    };

    const handleStatusUpdated = (data: any) => {
      if (data.ticketId === ticketId) {
        queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
      }
    };

    const handleTicketAssigned = (data: any) => {
      if (data.ticketId === ticketId) {
        queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
      }
    };

    const handleInternalNoteAdded = () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    };

    const handleTypingStart = (data: any) => {
      if (data.userName !== user.fullName) {
        setTypingUser(data.userName);
      }
    };

    const handleTypingStop = () => {
      setTypingUser(null);
    };

    // Listeners
    socketInstance.on('receive_message', handleReceiveMessage);
    socketInstance.on('messages_read', handleMessagesRead);
    socketInstance.on('user_status_change', handleUserStatusChange);
    socketInstance.on('ticket_status_updated', handleStatusUpdated);
    socketInstance.on('ticket_assigned', handleTicketAssigned);
    socketInstance.on('internal_note_added', handleInternalNoteAdded);
    socketInstance.on('user_typing_start', handleTypingStart);
    socketInstance.on('user_typing_stop', handleTypingStop);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketInstance.emit('leave_ticket', ticketId);
      socketInstance.off('receive_message', handleReceiveMessage);
      socketInstance.off('messages_read', handleMessagesRead);
      socketInstance.off('user_status_change', handleUserStatusChange);
      socketInstance.off('ticket_status_updated', handleStatusUpdated);
      socketInstance.off('ticket_assigned', handleTicketAssigned);
      socketInstance.off('internal_note_added', handleInternalNoteAdded);
      socketInstance.off('user_typing_start', handleTypingStart);
      socketInstance.off('user_typing_stop', handleTypingStop);
    };
  }, [ticketId, targetUserId, user, connect, queryClient]);

  const sendMessage = (content: string) => {
    if (socket && user && content.trim()) {
      socket.emit('send_message', {
        ticketId,
        senderId: user.id,
        content: content.trim(),
      });
      // Instantly clear local typing state when message is dispatched
      emitTyping(false);
    }
  };

  const emitTyping = (isTyping: boolean) => {
    if (!socket || !user) return;

    if (isTyping) {
      if (!lastEmitTypingRef.current) {
        socket.emit('typing_start', { ticketId, userName: user.fullName });
        lastEmitTypingRef.current = true;
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', { ticketId });
        lastEmitTypingRef.current = false;
      }, 2500);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (lastEmitTypingRef.current) {
        socket.emit('typing_stop', { ticketId });
        lastEmitTypingRef.current = false;
      }
    }
  };

  return {
    messages,
    typingUser,
    participantStatus,
    sendMessage,
    emitTyping,
  };
};
