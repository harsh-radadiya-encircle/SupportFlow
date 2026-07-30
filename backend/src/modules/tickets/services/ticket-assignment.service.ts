import { TicketStatus, Role } from '@prisma/client';
import { prisma } from '../../../utils/prisma';
import { ApiError } from '../../../common/exceptions/apiError';
import { AuthenticatedUser } from '../../../common/types';
import { NotificationService } from '../../../services/notification.service';
import { emitToTicketRoom } from '../../../socket/socketServer';

export class TicketAssignmentService {
  /**
   * Update Ticket Status
   */
  async updateStatus(ticketId: string, newStatus: TicketStatus, user: AuthenticatedUser) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
      throw ApiError.notFound('Ticket not found.');
    }

    const oldStatus = ticket.status;
    if (oldStatus === newStatus) {
      return ticket;
    }

    const updateData: any = { status: newStatus };
    if (newStatus === TicketStatus.RESOLVED) updateData.resolvedAt = new Date();
    if (newStatus === TicketStatus.CLOSED) updateData.closedAt = new Date();

    const updatedTicket = await prisma.$transaction(async (tx) => {
      const res = await tx.ticket.update({
        where: { id: ticketId },
        data: updateData,
        include: {
          customer: { select: { id: true, fullName: true, email: true } },
          assignedAgent: { select: { id: true, fullName: true, email: true } },
        },
      });

      // Immutable Activity Log
      await tx.ticketActivity.create({
        data: {
          ticketId,
          actorId: user.id,
          action: 'STATUS_CHANGED',
          details: { oldStatus, newStatus },
        },
      });

      return res;
    });

    // Broadcast Real-Time Status Change via Socket.IO Room
    emitToTicketRoom(ticketId, 'ticket_status_updated', { ticketId, status: newStatus });

    // Send Status Change or Resolution Notification to Customer
    if (newStatus === TicketStatus.RESOLVED || newStatus === TicketStatus.CLOSED) {
      NotificationService.sendNotification({
        userId: ticket.customerId,
        ticketId,
        title: '🎉 Ticket Resolved',
        message: `Great news! Your ticket #${ticket.ticketNumber || ticketId.substring(0, 6)} has been marked as ${newStatus}.`,
        type: 'TICKET_RESOLVED',
      }).catch(() => null);
    } else {
      NotificationService.sendNotification({
        userId: ticket.customerId,
        ticketId,
        title: '🔄 Ticket Status Updated',
        message: `Your ticket #${ticket.ticketNumber || ticketId.substring(0, 6)} status has been updated to ${newStatus}.`,
        type: 'STATUS_CHANGED',
      }).catch(() => null);
    }

    return updatedTicket;
  }

  /**
   * Assign Support Agent to Ticket
   */
  async assignAgent(ticketId: string, assignedAgentId: string, user: AuthenticatedUser) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw ApiError.notFound('Ticket not found.');

    const agent = await prisma.user.findUnique({
      where: { id: assignedAgentId },
      select: { id: true, fullName: true, role: true, businessId: true },
    });

    if (!agent || agent.businessId !== ticket.businessId) {
      throw ApiError.badRequest('Selected support agent is not a member of this business team.');
    }

    const newStatus = ticket.status === TicketStatus.OPEN ? TicketStatus.ASSIGNED : ticket.status;

    const updatedTicket = await prisma.$transaction(async (tx) => {
      const res = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          assignedAgentId,
          status: newStatus,
        },
        include: {
          assignedAgent: { select: { id: true, fullName: true, email: true } },
        },
      });

      await tx.ticketActivity.create({
        data: {
          ticketId,
          actorId: user.id,
          action: 'AGENT_ASSIGNED',
          details: { agentId: agent.id, agentName: agent.fullName },
        },
      });

      return res;
    });

    // Broadcast Real-Time Agent Assignment via Socket.IO Room
    emitToTicketRoom(ticketId, 'ticket_assigned', { ticketId, assignedAgentId });

    // Dispatch FCM & In-App Notification to Assigned Agent!
    NotificationService.sendNotification({
      userId: assignedAgentId,
      ticketId,
      title: '📩 New Ticket Assigned',
      message: `You have been assigned to Ticket #${ticket.ticketNumber || ticketId.substring(0, 6)}: "${ticket.title}".`,
      type: 'TICKET_ASSIGNED',
    }).catch(() => null);

    return updatedTicket;
  }

  /**
   * Add Agent Private Internal Note
   */
  async addInternalNote(ticketId: string, content: string, user: AuthenticatedUser) {
    if (user.role === Role.CUSTOMER) {
      throw ApiError.forbidden('Customers are not permitted to add internal notes.');
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw ApiError.notFound('Ticket not found.');

    const note = await prisma.$transaction(async (tx) => {
      const newNote = await tx.internalNote.create({
        data: {
          ticketId,
          authorId: user.id,
          content,
        },
        include: {
          author: { select: { id: true, fullName: true, role: true } },
        },
      });

      await tx.ticketActivity.create({
        data: {
          ticketId,
          actorId: user.id,
          action: 'INTERNAL_NOTE_ADDED',
          details: { noteId: newNote.id, snippet: content.substring(0, 50) },
        },
      });

      return newNote;
    });

    // Broadcast Real-Time Internal Note Addition via Socket.IO Room
    emitToTicketRoom(ticketId, 'internal_note_added', note);

    return note;
  }
}
