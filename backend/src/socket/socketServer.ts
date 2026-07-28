import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env';

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
