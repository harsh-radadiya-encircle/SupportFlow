import { prisma } from '../../../utils/prisma';

export class AgentMetricsService {
  /**
   * Get Support Agent Dashboard Metrics (Assigned, Open, Waiting, Resolved, Recent Messages, Notifications)
   */
  async getAgentMetrics(agentId: string) {
    const assignedTicketsCount = await prisma.ticket.count({
      where: { assignedAgentId: agentId },
    });

    const openTicketsCount = await prisma.ticket.count({
      where: {
        assignedAgentId: agentId,
        status: { in: ['OPEN', 'ASSIGNED'] },
      },
    });

    const waitingTicketsCount = await prisma.ticket.count({
      where: {
        assignedAgentId: agentId,
        status: { in: ['WAITING_FOR_CUSTOMER', 'IN_PROGRESS'] },
      },
    });

    const resolvedTicketsCount = await prisma.ticket.count({
      where: {
        assignedAgentId: agentId,
        status: { in: ['RESOLVED', 'CLOSED'] },
      },
    });

    const recentMessages = await prisma.message.findMany({
      where: {
        ticket: {
          assignedAgentId: agentId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            customer: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: agentId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
        ticketId: true,
      },
    });

    return {
      summary: {
        assignedTickets: assignedTicketsCount,
        openTickets: openTicketsCount,
        waitingTickets: waitingTicketsCount,
        resolvedTickets: resolvedTicketsCount,
      },
      recentMessages,
      notifications,
    };
  }
}
