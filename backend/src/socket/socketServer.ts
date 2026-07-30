import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env';
import { prisma } from '../utils/prisma';

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join Ticket Room
    socket.on('join_ticket', (ticketId: string) => {
      socket.join(`ticket:${ticketId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined room: ticket:${ticketId}`);
    });

    // Leave Ticket Room
    socket.on('leave_ticket', (ticketId: string) => {
      socket.leave(`ticket:${ticketId}`);
      console.log(`[Socket.IO] Socket ${socket.id} left room: ticket:${ticketId}`);
    });

    // Join User Specific Room for Real-Time Push Notifications
    socket.on('join_user_room', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined user room: user:${userId}`);
    });

    // Send Real-Time Chat Message & Trigger NEW_MESSAGE Notification
    socket.on(
      'send_message',
      async (data: { ticketId: string; senderId: string; content: string }) => {
        try {
          if (!data.ticketId || !data.senderId || !data.content?.trim()) return;

          const message = await prisma.message.create({
            data: {
              ticketId: data.ticketId,
              senderId: data.senderId,
              content: data.content.trim(),
            },
            include: {
              sender: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
            },
          });

          // Update Ticket last update timestamp
          const ticket = await prisma.ticket.update({
            where: { id: data.ticketId },
            data: { updatedAt: new Date() },
            select: { ticketNumber: true, title: true, customerId: true, assignedAgentId: true },
          });

          // Broadcast message to ticket room
          io?.to(`ticket:${data.ticketId}`).emit('receive_message', message);

          // Determine recipient for NEW_MESSAGE Notification
          if (ticket) {
            const isCustomerSender = data.senderId === ticket.customerId;
            const recipientId = isCustomerSender ? ticket.assignedAgentId : ticket.customerId;

            if (recipientId) {
              const { NotificationService } = await import('../services/notification.service');
              NotificationService.sendNotification({
                userId: recipientId,
                ticketId: data.ticketId,
                title: '💬 New Reply Message',
                message: `${message.sender.fullName}: "${data.content.trim().substring(0, 45)}..."`,
                type: 'NEW_MESSAGE',
              }).catch(() => null);
            }
          }
        } catch (err: any) {
          console.error('[Socket.IO Send Message Error]:', err.message);
        }
      }
    );

    // Typing Indicators
    socket.on('typing_start', ({ ticketId, userName }: { ticketId: string; userName: string }) => {
      socket.to(`ticket:${ticketId}`).emit('user_typing_start', { ticketId, userName });
    });

    socket.on('typing_stop', ({ ticketId }: { ticketId: string }) => {
      socket.to(`ticket:${ticketId}`).emit('user_typing_stop', { ticketId });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[Socket.IO] Server initialized successfully.');
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
};

export const emitToTicketRoom = (ticketId: string, event: string, data: any) => {
  try {
    if (io) {
      io.to(`ticket:${ticketId}`).emit(event, data);
    }
  } catch (err) {
    console.warn('[Socket.IO Broadcast Error]:', err);
  }
};

export const emitToUserRoom = (userId: string, event: string, data: any) => {
  try {
    if (io) {
      io.to(`user:${userId}`).emit(event, data);
    }
  } catch (err) {
    console.warn('[Socket.IO User Broadcast Error]:', err);
  }
};
