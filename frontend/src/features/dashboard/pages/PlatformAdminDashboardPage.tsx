import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import { usePlatformDashboard } from '../hooks/useDashboard';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import {
  Building2,
  CreditCard,
  DollarSign,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Ban,
  Users,
  Ticket,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
  ArrowRight,
  BarChart3,
  Globe,
  Sparkles,
  PieChart as PieIcon,
  Activity,
} from 'lucide-react';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  isLoading?: boolean;
  trend?: { value: string; positive: boolean };
  link?: { label: string; to: string };
}> = ({ title, value, sub, icon, iconBg, isLoading, trend, link }) => (
  <Card glass className="p-5 border border-slate-200/80 shadow-sm space-y-3">
    <div className="flex items-start justify-between">
      <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
            trend.positive
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          {trend.positive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {trend.value}
        </div>
      )}
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mt-1.5" />
      ) : (
        <p className="text-2xl font-extrabold text-slate-900 mt-0.5 leading-tight">{value}</p>
      )}
      {sub && !isLoading && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{sub}</p>}
    </div>
    {link && (
      <Link
        to={link.to}
        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 pt-1 border-t border-slate-100"
      >
        {link.label} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    )}
  </Card>
);

export const PlatformAdminDashboardPage: React.FC = () => {
  const { data, isLoading, isError, error } = usePlatformDashboard();

  const s = data?.summary;
  const planCounts = data?.businessesByPlan || { FREE: 0, STANDARD: 0, BUSINESS: 0 };
  const subStatus = data?.subscriptionsByStatus || {};
  const growth = data?.monthlyGrowth || [];

  const planChartData = [
    { name: 'Free', value: planCounts.FREE, color: '#94a3b8' },
    { name: 'Standard', value: planCounts.STANDARD, color: '#6366f1' },
    { name: 'Business', value: planCounts.BUSINESS, color: '#a855f7' },
  ];

  const subStatusData = [
    { name: 'Active', value: subStatus.ACTIVE || 0, color: '#10b981' },
    { name: 'Cancelled', value: subStatus.CANCELLED || 0, color: '#f59e0b' },
    { name: 'Expired', value: subStatus.EXPIRED || 0, color: '#64748b' },
    { name: 'Past Due', value: subStatus.PAST_DUE || 0, color: '#ef4444' },
  ];

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-2">
        <div className="flex items-center gap-2 font-bold">
          <ShieldAlert className="w-5 h-5" /> Failed to load platform metrics
        </div>
        <p className="text-xs text-rose-600">
          {(error as any)?.response?.data?.message || 'An error occurred.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── PAGE HEADER ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Admin Overview</h1>
            <Badge variant="purple" className="text-xs font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 mr-1 inline" /> Global Control
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Real-time platform statistics — businesses, users, revenue, tickets, and growth trends.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/businesses"
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" /> Manage Businesses
          </Link>
          <Link
            to="/admin/subscriptions"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5" /> Subscriptions
          </Link>
        </div>
      </div>

      {/* ── SECTION 1: BUSINESS METRICS ──────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-500" /> Business Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Businesses"
            value={s?.totalBusinesses ?? '—'}
            sub="All registered businesses"
            icon={<Building2 className="w-5 h-5 text-indigo-600" />}
            iconBg="bg-indigo-50 border border-indigo-100"
            isLoading={isLoading}
            trend={{ value: `+${s?.newBusinessesThisMonth ?? 0} this month`, positive: true }}
            link={{ label: 'View all businesses', to: '/admin/businesses' }}
          />
          <StatCard
            title="Active Subscriptions"
            value={s?.activeSubscriptions ?? '—'}
            sub="Paying & active businesses"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50 border border-emerald-100"
            isLoading={isLoading}
          />
          <StatCard
            title="Suspended"
            value={s?.suspendedBusinesses ?? '—'}
            sub="Businesses with restricted access"
            icon={<Ban className="w-5 h-5 text-rose-600" />}
            iconBg="bg-rose-50 border border-rose-100"
            isLoading={isLoading}
          />
          <StatCard
            title="New This Month"
            value={s?.newBusinessesThisMonth ?? '—'}
            sub="Businesses joined this month"
            icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
            iconBg="bg-purple-50 border border-purple-100"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* ── SECTION 2: REVENUE METRICS ────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" /> Revenue
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Monthly Revenue (MRR)"
            value={s?.monthlyRevenue ?? '₹0'}
            sub="From paid subscriptions this month"
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50 border border-emerald-100"
            isLoading={isLoading}
            link={{ label: 'View subscriptions', to: '/admin/subscriptions' }}
          />
          <StatCard
            title="Yearly Revenue (ARR)"
            value={s?.yearlyRevenue ?? '₹0'}
            sub="Projected annual recurring revenue"
            icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
            iconBg="bg-indigo-50 border border-indigo-100"
            isLoading={isLoading}
          />
          <StatCard
            title="Standard Plans"
            value={planCounts.STANDARD}
            sub={`₹${(planCounts.STANDARD * 2499).toLocaleString('en-IN')}/mo contribution`}
            icon={<CreditCard className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-50 border border-blue-100"
            isLoading={isLoading}
          />
          <StatCard
            title="Business Plans"
            value={planCounts.BUSINESS}
            sub={`₹${(planCounts.BUSINESS * 6499).toLocaleString('en-IN')}/mo contribution`}
            icon={<Sparkles className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-50 border border-amber-100"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* ── SECTION 3: USER METRICS ───────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" /> Users Across Platform
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={s?.totalUsers ?? '—'}
            sub="All roles combined"
            icon={<Users className="w-5 h-5 text-slate-600" />}
            iconBg="bg-slate-100 border border-slate-200"
            isLoading={isLoading}
            trend={{ value: `+${s?.newUsersThisMonth ?? 0} this month`, positive: true }}
            link={{ label: 'View all users', to: '/admin/users' }}
          />
          <StatCard
            title="Business Admins"
            value={data?.businessesByPlan ? (planCounts.FREE + planCounts.STANDARD + planCounts.BUSINESS) : '—'}
            sub="Business account owners"
            icon={<UserCheck className="w-5 h-5 text-indigo-600" />}
            iconBg="bg-indigo-50 border border-indigo-100"
            isLoading={isLoading}
          />
          <StatCard
            title="Support Agents"
            value={s?.totalSupportAgents ?? '—'}
            sub="Active agents on the platform"
            icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50 border border-emerald-100"
            isLoading={isLoading}
          />
          <StatCard
            title="Customers"
            value={s?.totalCustomers ?? '—'}
            sub="End users raising tickets"
            icon={<UserX className="w-5 h-5 text-purple-600" />}
            iconBg="bg-purple-50 border border-purple-100"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* ── SECTION 4: TICKET METRICS ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-amber-500" /> Platform Tickets
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Tickets"
            value={s?.totalTickets ?? '—'}
            sub="All-time platform tickets"
            icon={<Ticket className="w-5 h-5 text-slate-600" />}
            iconBg="bg-slate-100 border border-slate-200"
            isLoading={isLoading}
          />
          <StatCard
            title="Open / In Progress"
            value={s?.openTickets ?? '—'}
            sub="Currently active tickets"
            icon={<Activity className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-50 border border-amber-100"
            isLoading={isLoading}
          />
          <StatCard
            title="Resolved / Closed"
            value={s?.resolvedTickets ?? '—'}
            sub={`${s?.platformResolutionRate ?? 0}% platform resolution rate`}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50 border border-emerald-100"
            isLoading={isLoading}
            trend={{ value: `${s?.platformResolutionRate ?? 0}% rate`, positive: (s?.platformResolutionRate ?? 0) >= 70 }}
          />
          <StatCard
            title="This Year"
            value={s?.newTicketsThisYear ?? '—'}
            sub={`+${s?.newTicketsThisMonth ?? 0} new this month`}
            icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
            iconBg="bg-indigo-50 border border-indigo-100"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* ── SECTION 5: CHARTS ROW ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 6-Month Growth Area Chart */}
        <Card glass className="lg:col-span-7 p-6 space-y-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">6-Month Growth Trend</h2>
            </div>
            <Badge variant="info" className="text-xs">Businesses · Users · Tickets</Badge>
          </div>
          {isLoading ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-500" /> Loading growth data...
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBiz" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '600' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="Businesses" stroke="#6366f1" strokeWidth={2} fill="url(#colorBiz)" dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="Users" stroke="#10b981" strokeWidth={2} fill="url(#colorUsers)" dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="Tickets" stroke="#f59e0b" strokeWidth={2} fill="url(#colorTickets)" dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Right Column: Plan Distribution + Subscription Status */}
        <div className="lg:col-span-5 space-y-5">
          {/* Businesses by Plan Donut */}
          <Card glass className="p-5 space-y-3 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Businesses by Plan</h2>
            </div>
            {isLoading ? (
              <div className="h-36 flex items-center justify-center text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
              </div>
            ) : (
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={58} paddingAngle={4} dataKey="value">
                      {planChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px', fontWeight: '600' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(v) => <span className="text-slate-600">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Subscription Status Breakdown */}
          <Card glass className="p-5 space-y-3 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Subscription Status</h2>
            </div>
            {isLoading ? (
              <div className="h-36 flex items-center justify-center text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
              </div>
            ) : (
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subStatusData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px', fontWeight: '600' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {subStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── SECTION 6: QUICK NAVIGATION CARDS ─────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
          Quick Navigation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              to: '/admin/businesses',
              icon: <Building2 className="w-5 h-5 text-indigo-600" />,
              bg: 'bg-indigo-50 border-indigo-100',
              label: 'Manage Businesses',
              sub: 'View, search, suspend or activate any registered business',
            },
            {
              to: '/admin/subscriptions',
              icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
              bg: 'bg-emerald-50 border-emerald-100',
              label: 'Subscription Management',
              sub: 'Manage plans, subscription statuses, and revenue per business',
            },
            {
              to: '/admin/users',
              icon: <Users className="w-5 h-5 text-purple-600" />,
              bg: 'bg-purple-50 border-purple-100',
              label: 'All Users',
              sub: 'View every user across all businesses and roles',
            },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="p-5 rounded-2xl border bg-white hover:shadow-md transition-all group flex items-start gap-4"
            >
              <div className={`w-10 h-10 rounded-xl border ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 font-normal mt-0.5 leading-relaxed">
                  {item.sub}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
