import { prisma } from "../../../utils/prisma";

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
        status: { in: ["OPEN", "ASSIGNED"] },
      },
    });

    const waitingTicketsCount = await prisma.ticket.count({
      where: {
        assignedAgentId: agentId,
        status: { in: ["WAITING_FOR_CUSTOMER", "IN_PROGRESS"] },
      },
    });

    const resolvedTicketsCount = await prisma.ticket.count({
      where: {
        assignedAgentId: agentId,
        status: { in: ["RESOLVED", "CLOSED"] },
      },
    });

    const recentMessages = await prisma.message.findMany({
      where: {
        ticket: {
          assignedAgentId: agentId,
        },
      },
      orderBy: { createdAt: "desc" },
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
      orderBy: { createdAt: "desc" },
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

  /**
   * Get paginated CSAT ratings.
   * - SUPPORT_AGENT: only tickets assigned to them
   * - BUSINESS_ADMIN: all tickets in the business
   */
  async getRatings(
    userId: string,
    role: string,
    businessId: string | undefined,
    page: number,
    limit: number,
    score?: number,
  ) {
    const where: Record<string, any> = {
      csatScore: score ? { equals: score } : { not: null },
    };

    if (role === "SUPPORT_AGENT") {
      where.assignedAgentId = userId;
    } else if (role === "BUSINESS_ADMIN" && businessId) {
      where.businessId = businessId;
    }

    const skip = (page - 1) * limit;

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          csatScore: true,
          csatComment: true,
          updatedAt: true,
          customer: {
            select: { id: true, fullName: true, email: true },
          },
          assignedAgent: {
            select: { id: true, fullName: true },
          },
        },
      }),
    ]);

    // Summary stats over ALL rated tickets in scope (not just current page)
    const allRated = await prisma.ticket.findMany({
      where: {
        ...(role === "SUPPORT_AGENT"
          ? { assignedAgentId: userId }
          : businessId
            ? { businessId }
            : {}),
        csatScore: { not: null },
      },
      select: { csatScore: true },
    });

    const totalRated = allRated.length;
    const avgScore =
      totalRated > 0
        ? parseFloat(
            (
              allRated.reduce((sum, t) => sum + (t.csatScore ?? 0), 0) /
              totalRated
            ).toFixed(2),
          )
        : 0;
    const fiveStarCount = allRated.filter((t) => t.csatScore === 5).length;
    const lowScoreCount = allRated.filter(
      (t) => (t.csatScore ?? 0) <= 2,
    ).length;

    return {
      summary: { totalRated, avgScore, fiveStarCount, lowScoreCount },
      data: tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
