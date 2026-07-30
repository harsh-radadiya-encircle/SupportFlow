import { prisma } from '../../../utils/prisma';

export class PlatformMetricsService {
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
