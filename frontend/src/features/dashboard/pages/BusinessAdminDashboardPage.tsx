import React from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
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
  Loader2,
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
      avgResponseTime: '18 mins',
      resolutionRate: 100,
    },
    ticketsByPriority: { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    ticketsByStatus: { OPEN: 0, ASSIGNED: 0, IN_PROGRESS: 0, WAITING_FOR_CUSTOMER: 0, RESOLVED: 0, CLOSED: 0 },
    agentWorkload: [],
    recentTickets: [],
  };

  const { summary, ticketsByPriority, ticketsByStatus, agentWorkload, recentTickets } = metrics;

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Admin Dashboard</h1>
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
            <Button variant="primary" size="md" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">
              <Plus className="w-4 h-4 mr-1.5" />
              New Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* 1-4. Top Summary Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <Card glass className="flex items-center gap-4 p-5 border border-slate-200/80">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tickets</p>
            <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{summary.totalTickets}</p>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> Live Ticket Volume
            </span>
          </div>
        </Card>

        {/* Open Tickets */}
        <Card glass className="flex items-center gap-4 p-5 border border-slate-200/80">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Tickets</p>
            <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{summary.openTickets}</p>
            <span className="text-xs text-amber-600 font-semibold mt-1 block">Requires agent action</span>
          </div>
        </Card>

        {/* Resolved Tickets */}
        <Card glass className="flex items-center gap-4 p-5 border border-slate-200/80">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved Tickets</p>
            <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{summary.resolvedTickets}</p>
            <span className="text-xs text-emerald-600 font-semibold mt-1 block">{summary.resolutionRate}% resolution rate</span>
          </div>
        </Card>

        {/* Average Response Time */}
        <Card glass className="flex items-center gap-4 p-5 border border-slate-200/80">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Response Time</p>
            <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{summary.avgResponseTime}</p>
            <span className="text-xs text-purple-600 font-semibold mt-1 block">Target: &lt; 30 mins</span>
          </div>
        </Card>
      </div>

      {/* 5 & 6. Breakdown Grid: Tickets by Priority & Tickets by Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tickets by Priority */}
        <Card glass className="p-6 space-y-4 border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Tickets by Priority</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">Live Breakdown</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* Urgent */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-rose-600 flex items-center gap-1">🔴 Urgent Priority</span>
                <span className="text-slate-900">{ticketsByPriority.URGENT} tickets</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${summary.totalTickets > 0 ? (ticketsByPriority.URGENT / summary.totalTickets) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* High */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-600 flex items-center gap-1">🟠 High Priority</span>
                <span className="text-slate-900">{ticketsByPriority.HIGH} tickets</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${summary.totalTickets > 0 ? (ticketsByPriority.HIGH / summary.totalTickets) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-sky-600 flex items-center gap-1">🔵 Medium Priority</span>
                <span className="text-slate-900">{ticketsByPriority.MEDIUM} tickets</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${summary.totalTickets > 0 ? (ticketsByPriority.MEDIUM / summary.totalTickets) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Low */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 flex items-center gap-1">⚪ Low Priority</span>
                <span className="text-slate-900">{ticketsByPriority.LOW} tickets</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full transition-all duration-300"
                  style={{
                    width: `${summary.totalTickets > 0 ? (ticketsByPriority.LOW / summary.totalTickets) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Tickets by Status */}
        <Card glass className="p-6 space-y-4 border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <BarChart2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Tickets by Status</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">Current Queue</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Open</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{ticketsByStatus.OPEN}</p>
              </div>
              <Badge variant="info" className="text-[10px]">Unassigned</Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Assigned</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{ticketsByStatus.ASSIGNED}</p>
              </div>
              <Badge variant="purple" className="text-[10px]">With Agent</Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">In Progress</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{ticketsByStatus.IN_PROGRESS}</p>
              </div>
              <Badge variant="warning" className="text-[10px]">Active</Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Waiting Customer</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{ticketsByStatus.WAITING_FOR_CUSTOMER}</p>
              </div>
              <Badge variant="warning" className="text-[10px]">Pending</Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between col-span-2">
              <div>
                <span className="text-xs font-semibold text-emerald-800 block">Resolved / Closed</span>
                <p className="text-lg font-bold text-emerald-900 mt-0.5">
                  {ticketsByStatus.RESOLVED + ticketsByStatus.CLOSED}
                </p>
              </div>
              <Badge variant="success" className="text-[10px]">Completed</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* 7. Agent Workload Distribution Table */}
      <Card glass className="p-6 space-y-4 border border-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Agent Workload Distribution</h2>
          </div>
          <Link to="/business/team" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
            Manage Team <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {agentWorkload.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-normal">
            No support agents invited yet. Go to <Link to="/business/team" className="text-indigo-600 font-semibold underline">Manage Team</Link> to send agent invites.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase font-semibold border-b border-slate-100 text-[10px]">
                  <th className="pb-3">Support Agent</th>
                  <th className="pb-3">Active Tickets</th>
                  <th className="pb-3">Resolved</th>
                  <th className="pb-3">Total Assigned</th>
                  <th className="pb-3 text-right">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agentWorkload.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {agent.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{agent.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{agent.email}</p>
                      </div>
                    </td>
                    <td className="py-3 font-bold text-slate-900">{agent.activeTickets}</td>
                    <td className="py-3 font-medium text-emerald-600">{agent.resolvedTickets}</td>
                    <td className="py-3 font-medium text-slate-600">{agent.totalAssigned}</td>
                    <td className="py-3 text-right">
                      {agent.activeTickets >= 5 ? (
                        <Badge variant="danger" className="text-[10px]">High Workload</Badge>
                      ) : agent.activeTickets >= 2 ? (
                        <Badge variant="warning" className="text-[10px]">Moderate</Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">Available</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 8. Recent Customer Tickets Table */}
      <Card glass className="p-6 space-y-4 border border-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Ticket className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Recent Customer Tickets</h2>
          </div>
          <Link to="/business/tickets" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
            View All Tickets <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Loading recent tickets...
          </div>
        ) : recentTickets.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">No customer tickets created yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTickets.map((t) => (
              <div key={t.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    #{t.ticketNumber || t.id.substring(0, 6)}
                  </span>
                  <div>
                    <Link
                      to={`/tickets/${t.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-slate-400" />
                      Raised by {t.customer?.fullName || 'Customer'} • {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getPriorityBadge(t.priority)}
                  {getStatusBadge(t.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
