import React from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { StatCard } from '../../../shared/components/ui/StatCard';
import {
  StatusDonutChart,
  DonutChartItem,
} from '../../../shared/components/charts/StatusDonutChart';
import { PriorityBarChart, BarChartItem } from '../../../shared/components/charts/PriorityBarChart';
import { useBusinessDashboard } from '../hooks/useDashboard';
import {
  Ticket,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Plus,
  ChevronRight,
  User,
  PieChart,
  BarChart2,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const BusinessAdminDashboardPage: React.FC = () => {
  const { data, isLoading } = useBusinessDashboard();

  // Robust Fallback Data so UI renders seamlessly even while loading
  const metrics = data || {
    summary: {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      avgResponseTime: '0 mins',
      resolutionRate: 0,
    },
    ticketsByPriority: { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    ticketsByStatus: {
      OPEN: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      WAITING_FOR_CUSTOMER: 0,
      RESOLVED: 0,
      CLOSED: 0,
    },
    agentWorkload: [],
    recentTickets: [],
  };

  const { summary, ticketsByPriority, ticketsByStatus, agentWorkload, recentTickets } = metrics;

  const statusChartData: DonutChartItem[] = [
    { name: 'Open', value: ticketsByStatus.OPEN || 0, color: '#6366f1' },
    { name: 'Assigned', value: ticketsByStatus.ASSIGNED || 0, color: '#8b5cf6' },
    { name: 'In Progress', value: ticketsByStatus.IN_PROGRESS || 0, color: '#f59e0b' },
    {
      name: 'Waiting Customer',
      value: ticketsByStatus.WAITING_FOR_CUSTOMER || 0,
      color: '#f97316',
    },
    { name: 'Resolved', value: ticketsByStatus.RESOLVED || 0, color: '#10b981' },
    { name: 'Closed', value: ticketsByStatus.CLOSED || 0, color: '#64748b' },
  ];

  const priorityChartData: BarChartItem[] = [
    { label: 'Urgent', count: ticketsByPriority.URGENT || 0, fill: '#ef4444' },
    { label: 'High', count: ticketsByPriority.HIGH || 0, fill: '#f59e0b' },
    { label: 'Medium', count: ticketsByPriority.MEDIUM || 0, fill: '#6366f1' },
    { label: 'Low', count: ticketsByPriority.LOW || 0, fill: '#94a3b8' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="info">Open</Badge>;
      case 'ASSIGNED':
        return <Badge variant="purple">Assigned</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning">In Progress</Badge>;
      case 'WAITING_FOR_CUSTOMER':
        return <Badge variant="warning">Waiting Customer</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">Resolved</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="danger">Urgent</Badge>;
      case 'HIGH':
        return <Badge variant="warning">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="info">Medium</Badge>;
      case 'LOW':
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Business Admin Dashboard
          </h1>
          <p className="text-sm font-normal text-slate-500">
            Real-time analytics, agent workloads, and ticket status breakdowns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/business/team">
            <Button variant="outline" size="md" className="font-semibold">
              <Users className="w-4 h-4 mr-1.5" />
              Manage Team
            </Button>
          </Link>
          <Link to="/customer/tickets/new">
            <Button
              variant="primary"
              size="md"
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Summary Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tickets"
          value={summary.totalTickets}
          sub="Live Ticket Volume"
          icon={<Ticket className="w-6 h-6 text-indigo-600" />}
          iconBg="bg-indigo-50 border border-indigo-100"
          trend={{ value: 'Live Volume', positive: true }}
        />
        <StatCard
          title="Open Tickets"
          value={summary.openTickets}
          sub="Requires agent action"
          icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
          iconBg="bg-amber-50 border border-amber-100"
        />
        <StatCard
          title="Resolved Tickets"
          value={summary.resolvedTickets}
          sub={`${summary.resolutionRate}% resolution rate`}
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-50 border border-emerald-100"
        />
        <StatCard
          title="Avg Response Time"
          value={summary.avgResponseTime}
          sub="Target: < 30 mins"
          icon={<Clock className="w-6 h-6 text-purple-600" />}
          iconBg="bg-purple-50 border border-purple-100"
        />
      </div>

      {/* Shared Reusable Charts: Tickets by Priority & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card glass className="p-6 space-y-4 border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Tickets by Priority</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">Live Breakdown</span>
          </div>
          <PriorityBarChart
            data={priorityChartData}
            isLoading={isLoading}
            emptyMessage="No tickets found"
            height={220}
          />
        </Card>

        <Card glass className="p-6 space-y-4 border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Tickets by Status</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">Live Status</span>
          </div>
          <StatusDonutChart
            data={statusChartData}
            isLoading={isLoading}
            emptyMessage="No tickets found"
            height={220}
          />
        </Card>
      </div>

      {/* Agent Workload Overview */}
      <Card glass className="p-6 space-y-4 border border-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Agent Workload Overview</h2>
          </div>
          <Link
            to="/business/team"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            Manage Team <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        {agentWorkload.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-normal">
            No support agents invited yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {agentWorkload.map((agent) => (
              <div
                key={agent.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {agent.fullName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{agent.fullName}</h4>
                    <p className="text-[10px] text-slate-400">{agent.email}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">
                    Active: <b className="text-indigo-600">{agent.activeTickets}</b>
                  </span>
                  <span className="text-slate-500 font-medium">
                    Resolved: <b className="text-emerald-600">{agent.resolvedTickets}</b>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Tickets Table */}
      <Card glass className="p-6 space-y-4 border border-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Recent Customer Tickets</h2>
          <Link
            to="/business/tickets"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            View All Tickets <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No tickets created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead>
                <tr className="text-slate-400 uppercase font-semibold border-b border-slate-100 text-[10px]">
                  <th className="pb-3">Ticket ID</th>
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-bold text-indigo-600">
                      #{t.ticketNumber || t.id.slice(0, 6)}
                    </td>
                    <td className="py-3 font-semibold text-slate-900">{t.title}</td>
                    <td className="py-3 text-slate-600">{t.customer?.fullName || 'Anonymous'}</td>
                    <td className="py-3">{getStatusBadge(t.status)}</td>
                    <td className="py-3">{getPriorityBadge(t.priority)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
