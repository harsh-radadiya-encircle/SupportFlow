import { prisma } from '../../../utils/prisma';

export class BusinessMetricsService {
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
}
