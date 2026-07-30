import { TicketCategory, TicketPriority, TicketStatus, Role } from '@prisma/client';
import { prisma } from '../../../utils/prisma';
import { ApiError } from '../../../common/exceptions/apiError';
import { AuthenticatedUser } from '../../../common/types';
import { NotificationService } from '../../../services/notification.service';

export interface CreateTicketDto {
  title: string;
  description: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  businessId?: string;
}

export interface TicketFilterQuery {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  search?: string;
  page?: number;
  limit?: number;
}

export class TicketCrudService {
  /**
   * Customer creates a new support ticket
   */
  async createTicket(dto: CreateTicketDto, user: AuthenticatedUser) {
    let targetBusinessId = dto.businessId || user.businessId;

    if (!targetBusinessId) {
      // Default to first active non-suspended business if customer didn't select one
      const defaultBusiness = await prisma.business.findFirst({
        where: { isSuspended: false },
        orderBy: { createdAt: 'asc' },
      });

      if (!defaultBusiness) {
        throw ApiError.badRequest('No active business available to receive support tickets.');
      }
      targetBusinessId = defaultBusiness.id;
    }

    const business = await prisma.business.findUnique({
      where: { id: targetBusinessId },
    });

    if (!business || business.isSuspended) {
      throw ApiError.badRequest('The selected business is invalid or currently suspended.');
    }

    // Enforce Free Plan Monthly Ticket Limits (Max 25 tickets/month)
    if (business.plan === 'FREE') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthlyTicketCount = await prisma.ticket.count({
        where: {
          businessId: targetBusinessId,
          createdAt: { gte: startOfMonth },
        },
      });

      if (monthlyTicketCount >= 25) {
        throw ApiError.forbidden(
          'This business has reached the Free Plan limit of 25 support tickets per month. Please contact the business administrator to upgrade their plan.'
        );
      }
    }

    // Create Ticket and initial Activity log in PostgreSQL transaction
    const ticket = await prisma.$transaction(async (tx) => {
      const newTicket = await tx.ticket.create({
        data: {
          title: dto.title,
          description: dto.description,
          category: dto.category || TicketCategory.GENERAL_INQUIRY,
          priority: dto.priority || TicketPriority.MEDIUM,
          status: TicketStatus.OPEN,
          businessId: targetBusinessId,
          customerId: user.id,
        },
        include: {
          customer: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          business: { select: { id: true, name: true } },
        },
      });

      // Log immutable Activity History
      await tx.ticketActivity.create({
        data: {
          ticketId: newTicket.id,
          actorId: user.id,
          action: 'TICKET_CREATED',
          details: {
            title: newTicket.title,
            category: newTicket.category,
            priority: newTicket.priority,
            ticketNumber: newTicket.ticketNumber,
          },
        },
      });

      // Initial Message
      await tx.message.create({
        data: {
          ticketId: newTicket.id,
          senderId: user.id,
          content: dto.description,
        },
      });

      return newTicket;
    });

    // Notify Business Admins of new ticket creation
    prisma.user
      .findMany({
        where: { businessId: targetBusinessId, role: Role.BUSINESS_ADMIN },
        select: { id: true },
      })
      .then((admins) => {
        admins.forEach((admin) => {
          NotificationService.sendNotification({
            userId: admin.id,
            ticketId: ticket.id,
            title: '🎫 New Ticket Created',
            message: `New ticket #${ticket.ticketNumber || ticket.id.substring(0, 6)}: "${ticket.title}" created by ${user.fullName}.`,
            type: 'NEW_TICKET',
          }).catch(() => null);
        });
      })
      .catch(() => null);

    return ticket;
  }

  /**
   * Role-scoped ticket listing with filters and pagination
   */
  async getTickets(user: AuthenticatedUser, query: TicketFilterQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Role-Scoped Access Control
    if (user.role === Role.CUSTOMER) {
      where.customerId = user.id;
    } else if (user.role === Role.SUPPORT_AGENT) {
      where.businessId = user.businessId || '';
      where.assignedAgentId = user.id; // Strictly ONLY tickets assigned to this agent
    } else if (user.role === Role.BUSINESS_ADMIN) {
      where.businessId = user.businessId || '';
    }
    // PLATFORM_ADMIN sees all tickets

    // Filter Badges & Search
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;

    if (query.search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          assignedAgent: { select: { id: true, fullName: true, email: true } },
          business: { select: { id: true, name: true } },
          _count: { select: { messages: true, internalNotes: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single ticket by ID with role-based internal note filtering
   */
  async getTicketById(ticketId: string, user: AuthenticatedUser) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        assignedAgent: { select: { id: true, fullName: true, email: true } },
        business: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
          },
        },
        internalNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, fullName: true, role: true } },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            actor: { select: { id: true, fullName: true, role: true } },
          },
        },
      },
    });

    if (!ticket) {
      throw ApiError.notFound('Ticket not found.');
    }

    // Permission Verification
    if (user.role === Role.CUSTOMER && ticket.customerId !== user.id) {
      throw ApiError.forbidden('You do not have permission to view this support ticket.');
    }

    if (
      (user.role === Role.SUPPORT_AGENT || user.role === Role.BUSINESS_ADMIN) &&
      ticket.businessId !== user.businessId
    ) {
      throw ApiError.forbidden(
        'You do not have permission to access tickets for another business.'
      );
    }

    // Role Security Guard: Strip internal notes for CUSTOMER role
    if (user.role === Role.CUSTOMER) {
      return {
        ...ticket,
        internalNotes: [], // Strictly hidden from customer
      };
    }

    return ticket;
  }

  /**
   * Submit Customer Satisfaction (CSAT) rating
   */
  async submitCsat(ticketId: string, score: number, comment: string | undefined, user: AuthenticatedUser) {
    if (user.role !== Role.CUSTOMER) {
      throw ApiError.forbidden('Only customers can submit CSAT ratings.');
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw ApiError.notFound('Ticket not found.');
    }

    if (ticket.customerId !== user.id) {
      throw ApiError.forbidden('You can only rate your own tickets.');
    }

    if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
      throw ApiError.badRequest('You can only rate a ticket after it has been resolved.');
    }

    if (ticket.csatScore) {
      throw ApiError.badRequest('You have already rated this ticket.');
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        csatScore: score,
        csatComment: comment || null,
      },
    });

    // Notify the assigned agent
    if (updatedTicket.assignedAgentId) {
      NotificationService.sendNotification({
        userId: updatedTicket.assignedAgentId,
        ticketId: ticket.id,
        title: '⭐ New CSAT Rating Received',
        message: `Your ticket #${ticket.ticketNumber || ticket.id.substring(0, 6)} received a ${score}/5 rating!`,
        type: 'CSAT_RECEIVED',
      }).catch(() => null);
    }

    return updatedTicket;
  }
}
