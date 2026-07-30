import { prisma } from '../../utils/prisma';

export class DashboardService {
  /**
   * Get comprehensive Analytics Metrics for Business Admin Dashboard & Reports
   */
  async getBusinessAdminMetrics(businessId: string, startDateStr?: string, endDateStr?: string) {
    const whereClause: any = { businessId };
    if (startDateStr || endDateStr) {
      whereClause.createdAt = {};
      if (startDateStr) whereClause.createdAt.gte = new Date(startDateStr);
      if (endDateStr) whereClause.createdAt.lte = new Date(endDateStr);
    }

    // 1. Total Tickets
    const totalTickets = await prisma.ticket.count({
      where: whereClause,
    });

    // 2. Open Tickets (OPEN, ASSIGNED, IN_PROGRESS, WAITING_FOR_CUSTOMER)
    const openTickets = await prisma.ticket.count({
      where: {
        ...whereClause,
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'] },
      },
    });

    // 3. Ticket Resolution Count (RESOLVED, CLOSED)
    const resolvedTickets = await prisma.ticket.count({
      where: {
        ...whereClause,
        status: { in: ['RESOLVED', 'CLOSED'] },
      },
    });

    // 4. Calculate Dynamic Avg First Response Time
    const respondedTickets = await prisma.ticket.findMany({
      where: {
        ...whereClause,
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
      avgResponseTimeFormatted =
        avgMinutes < 60 ? `${avgMinutes} mins` : `${Math.round(avgMinutes / 60)} hrs`;
    }

    // 5. Calculate Dynamic Avg Resolution Time
    const resolvedList = await prisma.ticket.findMany({
      where: {
        ...whereClause,
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
      where: whereClause,
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
      where: whereClause,
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

    // 8. Tickets by Category Breakdown
    const categoryGroup = await prisma.ticket.groupBy({
      by: ['category'],
      where: whereClause,
      _count: { id: true },
    });

    const ticketsByCategory = {
      GENERAL_INQUIRY: 0,
      TECHNICAL_ISSUE: 0,
      BILLING: 0,
      FEATURE_REQUEST: 0,
      BUG_REPORT: 0,
    };
    categoryGroup.forEach((item) => {
      if (item.category in ticketsByCategory) {
        ticketsByCategory[item.category as keyof typeof ticketsByCategory] = item._count.id;
      }
    });

    // 9. Agent Workload Breakdown
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
            createdAt: true,
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

    // 10. Recent Tickets (Top 5)
    const recentTickets = await prisma.ticket.findMany({
      where: whereClause,
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

    // 11. Dynamic Ticket Volume Timeline for last 7 days
    const daysList = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const allRangeTickets = await prisma.ticket.findMany({
      where: { businessId },
      select: { createdAt: true, status: true },
    });

    const timeline = daysList.map((d) => {
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const createdCount = allRangeTickets.filter(
        (t) => new Date(t.createdAt) >= dayStart && new Date(t.createdAt) <= dayEnd
      ).length;

      const resolvedCount = allRangeTickets.filter(
        (t) =>
          (t.status === 'RESOLVED' || t.status === 'CLOSED') &&
          new Date(t.createdAt) >= dayStart &&
          new Date(t.createdAt) <= dayEnd
      ).length;

      return {
        date: dateLabel,
        Created: createdCount,
        Resolved: resolvedCount,
      };
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
      ticketsByCategory,
      agentWorkload,
      recentTickets,
      timeline,
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
   * Get Platform Admin Dashboard Metrics
   * Returns all platform-level statistics without the full businesses list
   * (the businesses list is served separately on the /admin/businesses page)
   */
  async getPlatformAdminMetrics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // ── BUSINESS COUNTS ──────────────────────────────────────────────────────
    const totalBusinesses = await prisma.business.count();
    const activeSubscriptions = await prisma.business.count({
      where: { subscriptionStatus: 'ACTIVE', isSuspended: false },
    });
    const suspendedBusinesses = await prisma.business.count({
      where: { isSuspended: true },
    });
    const newBusinessesThisMonth = await prisma.business.count({
      where: { createdAt: { gte: startOfMonth } },
    });

    // ── PLAN DISTRIBUTION ────────────────────────────────────────────────────
    const planGroup = await prisma.business.groupBy({
      by: ['plan'],
      _count: { id: true },
    });
    const businessesByPlan = { FREE: 0, STANDARD: 0, BUSINESS: 0 };
    planGroup.forEach((p) => {
      if (p.plan in businessesByPlan) {
        businessesByPlan[p.plan as keyof typeof businessesByPlan] = p._count.id;
      }
    });

    // ── REVENUE ──────────────────────────────────────────────────────────────
    const mrrNumber = businessesByPlan.STANDARD * 2499 + businessesByPlan.BUSINESS * 6499;
    const arrNumber = mrrNumber * 12;

    // ── USER COUNTS BY ROLE ──────────────────────────────────────────────────
    const userRoleGroup = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });
    const usersByRole: Record<string, number> = {
      PLATFORM_ADMIN: 0,
      BUSINESS_ADMIN: 0,
      SUPPORT_AGENT: 0,
      CUSTOMER: 0,
    };
    userRoleGroup.forEach((r) => {
      if (r.role in usersByRole) {
        usersByRole[r.role] = r._count.id;
      }
    });
    const totalUsers = Object.values(usersByRole).reduce((a, b) => a + b, 0);
    const newUsersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: startOfMonth } },
    });

    // ── TICKET COUNTS ────────────────────────────────────────────────────────
    const totalTickets = await prisma.ticket.count();
    const openTickets = await prisma.ticket.count({
      where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'] } },
    });
    const resolvedTickets = await prisma.ticket.count({
      where: { status: { in: ['RESOLVED', 'CLOSED'] } },
    });
    const newTicketsThisMonth = await prisma.ticket.count({
      where: { createdAt: { gte: startOfMonth } },
    });
    const newTicketsThisYear = await prisma.ticket.count({
      where: { createdAt: { gte: startOfYear } },
    });

    // ── 6-MONTH GROWTH TREND ─────────────────────────────────────────────────
    const monthlyGrowth = await Promise.all(
      Array.from({ length: 6 }, async (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

        const [businesses, users, tickets] = await Promise.all([
          prisma.business.count({ where: { createdAt: { gte: d, lte: end } } }),
          prisma.user.count({ where: { createdAt: { gte: d, lte: end } } }),
          prisma.ticket.count({ where: { createdAt: { gte: d, lte: end } } }),
        ]);

        return {
          month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
          Businesses: businesses,
          Users: users,
          Tickets: tickets,
        };
      })
    );

    // ── SUBSCRIPTION STATUS BREAKDOWN ────────────────────────────────────────
    const subStatusGroup = await prisma.business.groupBy({
      by: ['subscriptionStatus'],
      _count: { id: true },
    });
    const subscriptionsByStatus: Record<string, number> = {
      ACTIVE: 0, CANCELLED: 0, EXPIRED: 0, PAST_DUE: 0,
    };
    subStatusGroup.forEach((s) => {
      const key = s.subscriptionStatus || 'ACTIVE';
      subscriptionsByStatus[key] = (subscriptionsByStatus[key] || 0) + s._count.id;
    });

    // ── BUSINESSES LIST (for Subscriptions page only — lightweight) ──────────
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
        _count: { select: { users: true, tickets: true } },
        users: {
          where: { role: 'BUSINESS_ADMIN' },
          take: 1,
          select: { id: true, fullName: true, email: true },
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
        monthlyRevenue: `₹${mrrNumber.toLocaleString('en-IN')}`,
        mrrNumber,
        yearlyRevenue: `₹${arrNumber.toLocaleString('en-IN')}`,
        arrNumber,
        suspendedBusinesses,
        newBusinessesThisMonth,
        totalUsers,
        totalSupportAgents: usersByRole.SUPPORT_AGENT,
        totalCustomers: usersByRole.CUSTOMER,
        newUsersThisMonth,
        totalTickets,
        openTickets,
        resolvedTickets,
        newTicketsThisMonth,
        newTicketsThisYear,
        platformResolutionRate:
          totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0,
      },
      businessesByPlan,
      subscriptionsByStatus,
      monthlyGrowth,
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
