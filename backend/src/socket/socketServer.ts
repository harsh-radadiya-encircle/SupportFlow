import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "../config/env";
import { prisma } from "../utils/prisma";

let io: SocketIOServer | null = null;
const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join Ticket Room
    socket.on("join_ticket", (ticketId: string) => {
      socket.join(`ticket:${ticketId}`);
      console.log(
        `[Socket.IO] Socket ${socket.id} joined room: ticket:${ticketId}`,
      );
    });

    // Leave Ticket Room
    socket.on("leave_ticket", (ticketId: string) => {
      socket.leave(`ticket:${ticketId}`);
      console.log(
        `[Socket.IO] Socket ${socket.id} left room: ticket:${ticketId}`,
      );
    });

    // Join User Specific Room for Real-Time Push Notifications
    socket.on("join_user_room", (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(
        `[Socket.IO] Socket ${socket.id} joined user room: user:${userId}`,
      );

      // Track user presence
      (socket as any).userId = userId;
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId)!.add(socket.id);

      // Broadcast user status change
      io?.emit("user_status_change", { userId, status: "online" });
    });

    // Send Real-Time Chat Message & Trigger NEW_MESSAGE Notification
    socket.on(
      "send_message",
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
              sender: {
                select: {
                  id: true,
                  fullName: true,
                  role: true,
                  avatarUrl: true,
                },
              },
            },
          });

          // Update Ticket last update timestamp
          const ticket = await prisma.ticket.update({
            where: { id: data.ticketId },
            data: { updatedAt: new Date() },
            select: {
              ticketNumber: true,
              title: true,
              customerId: true,
              assignedAgentId: true,
              businessId: true,
            },
          });

          // Broadcast message to ticket room
          io?.to(`ticket:${data.ticketId}`).emit("receive_message", message);

          // Determine recipient for NEW_MESSAGE Notification
          if (ticket) {
            const isCustomerSender = data.senderId === ticket.customerId;
            const { NotificationService } =
              await import("../services/notification.service");

            if (isCustomerSender) {
              if (ticket.assignedAgentId) {
                NotificationService.sendNotification({
                  userId: ticket.assignedAgentId,
                  ticketId: data.ticketId,
                  title: "💬 New Customer Message",
                  message: `${message.sender.fullName}: "${data.content.trim().substring(0, 45)}..."`,
                  type: "NEW_MESSAGE",
                }).catch(() => null);
              }
              NotificationService.sendToBusinessAdmins(ticket.businessId, {
                ticketId: data.ticketId,
                title: "💬 New Customer Message",
                message: `${message.sender.fullName}: "${data.content.trim().substring(0, 45)}..."`,
                type: "NEW_MESSAGE",
              });
            } else {
              NotificationService.sendNotification({
                userId: ticket.customerId,
                ticketId: data.ticketId,
                title: "💬 Support Team Reply",
                message: `${message.sender.fullName}: "${data.content.trim().substring(0, 45)}..."`,
                type: "NEW_MESSAGE",
              }).catch(() => null);
            }
          }
        } catch (err: any) {
          console.error("[Socket.IO Send Message Error]:", err.message);
        }
      },
    );

    // Typing Indicators
    socket.on(
      "typing_start",
      ({ ticketId, userName }: { ticketId: string; userName: string }) => {
        socket
          .to(`ticket:${ticketId}`)
          .emit("user_typing_start", { ticketId, userName });
      },
    );

    socket.on("typing_stop", ({ ticketId }: { ticketId: string }) => {
      socket.to(`ticket:${ticketId}`).emit("user_typing_stop", { ticketId });
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      const userId = (socket as any).userId;
      if (userId) {
        const userSockets = onlineUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            onlineUsers.delete(userId);
            io?.emit("user_status_change", { userId, status: "offline" });
          }
        }
      }
    });

    // Check if target user is online
    socket.on(
      "check_user_status",
      (
        targetUserId: string,
        callback?: (status: "online" | "offline") => void,
      ) => {
        const isOnline = onlineUsers.has(targetUserId);
        if (callback) {
          callback(isOnline ? "online" : "offline");
        } else {
          socket.emit("user_status", {
            userId: targetUserId,
            status: isOnline ? "online" : "offline",
          });
        }
      },
    );

    // Mark messages as read by other user
    socket.on(
      "mark_messages_read",
      async (data: { ticketId: string; userId: string }) => {
        try {
          if (!data.ticketId || !data.userId) return;

          await prisma.message.updateMany({
            where: {
              ticketId: data.ticketId,
              senderId: { not: data.userId },
              isRead: false,
            },
            data: {
              isRead: true,
            },
          });

          io?.to(`ticket:${data.ticketId}`).emit("messages_read", {
            ticketId: data.ticketId,
            readerId: data.userId,
          });
        } catch (err: any) {
          console.error("[Socket.IO Mark Messages Read Error]:", err.message);
        }
      },
    );
  });

  console.log("[Socket.IO] Server initialized successfully.");
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.IO is not initialized!");
  }
  return io;
};

export const emitToTicketRoom = (
  ticketId: string,
  event: string,
  data: any,
) => {
  try {
    if (io) {
      io.to(`ticket:${ticketId}`).emit(event, data);
    }
  } catch (err) {
    console.warn("[Socket.IO Broadcast Error]:", err);
  }
};

export const emitToUserRoom = (userId: string, event: string, data: any) => {
  try {
    if (io) {
      io.to(`user:${userId}`).emit(event, data);
    }
  } catch (err) {
    console.warn("[Socket.IO User Broadcast Error]:", err);
  }
};
