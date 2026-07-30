import { prisma } from '../../utils/prisma';

export class DashboardService {
  /**
   * Get comprehensive Analytics Metrics for Business Admin Dashboard & Reports
   */
  async getBusinessAdminMetrics(businessId: string) {
    // 1. Total Tickets
    const totalTickets = await prisma.ticket.count({
      where: { businessId },
    });

    // 2. Open Tickets (OPEN, ASSIGNED, IN_PROGRESS, WAITING_FOR_CUSTOMER)
    const openTickets = await prisma.ticket.count({
      where: {
        businessId,
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'] },
      },
    });

    // 3. Ticket Resolution Count (RESOLVED, CLOSED)
    const resolvedTickets = await prisma.ticket.count({
      where: {
        businessId,
        status: { in: ['RESOLVED', 'CLOSED'] },
      },
    });

    // 4. Calculate Dynamic Avg First Response Time
    const respondedTickets = await prisma.ticket.findMany({
      where: {
        businessId,
        firstResponseAt: { not: null },
      },
      select: {
        createdAt: true,
        firstResponseAt: true,
      },
    });

    let avgResponseTimeFormatted = '0 mins';
    if (respondedTickets.length > 0) {
      const totalMinutes = respondedTickets.reduce((acc, t) => {
        const diffMs = new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime();
        return acc + Math.max(1, Math.round(diffMs / (1000 * 60)));
      }, 0);
      const avgMinutes = Math.round(totalMinutes / respondedTickets.length);
      avgResponseTimeFormatted = avgMinutes < 60 ? `${avgMinutes} mins` : `${Math.round(avgMinutes / 60)} hrs`;
    }

    // 5. Calculate Dynamic Avg Resolution Time
    const resolvedList = await prisma.ticket.findMany({
      where: {
        businessId,
        status: { in: ['RESOLVED', 'CLOSED'] },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    let avgResolutionTimeFormatted = '0 hrs';
    if (resolvedList.length > 0) {
      const totalHours = resolvedList.reduce((acc, t) => {
        const diffMs = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
        return acc + Math.max(0.1, diffMs / (1000 * 60 * 60));
      }, 0);
      const avgHours = (totalHours / resolvedList.length).toFixed(1);
      avgResolutionTimeFormatted = `${avgHours} hrs`;
    }

    // 6. Tickets by Priority Breakdown
    const priorityGroup = await prisma.ticket.groupBy({
      by: ['priority'],
      where: { businessId },
      _count: { id: true },
    });

    const ticketsByPriority = {
      URGENT: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    priorityGroup.forEach((item) => {
      if (item.priority in ticketsByPriority) {
        ticketsByPriority[item.priority as keyof typeof ticketsByPriority] = item._count.id;
      }
    });

    // 7. Tickets by Status Breakdown
    const statusGroup = await prisma.ticket.groupBy({
      by: ['status'],
      where: { businessId },
      _count: { id: true },
    });

    const ticketsByStatus = {
      OPEN: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      WAITING_FOR_CUSTOMER: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };
    statusGroup.forEach((item) => {
      if (item.status in ticketsByStatus) {
        ticketsByStatus[item.status as keyof typeof ticketsByStatus] = item._count.id;
      }
    });

    // 8. Agent Workload Breakdown
    const agents = await prisma.user.findMany({
      where: {
        businessId,
        role: 'SUPPORT_AGENT',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        assignedTickets: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    const agentWorkload = agents.map((agent) => {
      const activeTicketsCount = agent.assignedTickets.filter(
        (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED'
      ).length;
      const resolvedCount = agent.assignedTickets.filter(
        (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
      ).length;

      return {
        id: agent.id,
        fullName: agent.fullName,
        email: agent.email,
        activeTickets: activeTicketsCount,
        resolvedTickets: resolvedCount,
        totalAssigned: agent.assignedTickets.length,
      };
    });

    // 9. Recent Tickets (Top 5)
    const recentTickets = await prisma.ticket.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return {
      summary: {
        totalTickets,
        openTickets,
        resolvedTickets,
        avgResponseTime: avgResponseTimeFormatted,
        avgResolutionTime: avgResolutionTimeFormatted,
        resolutionRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0,
      },
      ticketsByPriority,
      ticketsByStatus,
      agentWorkload,
      recentTickets,
    };
  }

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

    // Recent Messages on tickets assigned to the agent
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
          },
        },
      },
    });

    // Recent Notifications for this Agent
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

  /**
   * Get Platform Admin Dashboard Metrics (Total Businesses, Active Subscriptions, MRR, Businesses by Plan, Suspended Count, Businesses List)
   */
  async getPlatformAdminMetrics() {
    const totalBusinesses = await prisma.business.count();
    const activeSubscriptions = await prisma.business.count({
      where: {
        subscriptionStatus: 'ACTIVE',
        isSuspended: false,
      },
    });
    const suspendedBusinesses = await prisma.business.count({
      where: { isSuspended: true },
    });

    const planGroup = await prisma.business.groupBy({
      by: ['plan'],
      _count: { id: true },
    });

    const businessesByPlan = {
      FREE: 0,
      STANDARD: 0,
      BUSINESS: 0,
    };
    planGroup.forEach((p) => {
      if (p.plan in businessesByPlan) {
        businessesByPlan[p.plan as keyof typeof businessesByPlan] = p._count.id;
      }
    });

    // Monthly Recurring Revenue calculation ($49 for STANDARD, $149 for BUSINESS)
    const monthlyRevenue = businessesByPlan.STANDARD * 49 + businessesByPlan.BUSINESS * 149;

    const businesses = await prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        subscriptionStatus: true,
        isSuspended: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            tickets: true,
          },
        },
        users: {
          where: { role: 'BUSINESS_ADMIN' },
          take: 1,
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    const formattedBusinesses = businesses.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      plan: b.plan,
      subscriptionStatus: b.subscriptionStatus,
      isSuspended: b.isSuspended,
      createdAt: b.createdAt,
      usersCount: b._count.users,
      ticketsCount: b._count.tickets,
      ownerName: b.users[0]?.fullName || 'System Owner',
      ownerEmail: b.users[0]?.email || 'N/A',
    }));

    return {
      summary: {
        totalBusinesses,
        activeSubscriptions,
        monthlyRevenue: `$${monthlyRevenue.toLocaleString()}`,
        mrrNumber: monthlyRevenue,
        suspendedBusinesses,
      },
      businessesByPlan,
      businesses: formattedBusinesses,
    };
  }

  /**
   * Toggle Business Suspension State (Platform Admin Only)
   */
  async toggleBusinessSuspension(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('Business account not found.');
    }

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        isSuspended: !business.isSuspended,
      },
    });

    return updated;
  }
}
