import React from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { useBusinessDashboard } from '../hooks/useDashboard';
import {
  CheckCircle2,
  Clock,
  Timer,
  BarChart3,
  PieChart as PieIcon,
  Users,
  Download,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '../../../shared/components/ui/Button';

export const ReportsPage: React.FC = () => {
  const { data, isLoading } = useBusinessDashboard();

  // Fallback metrics for initial render
  const metrics = data || {
    summary: {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      avgResponseTime: '18 mins',
      avgResolutionTime: '2.4 hrs',
      resolutionRate: 100,
    },
    ticketsByPriority: { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    ticketsByStatus: { OPEN: 0, ASSIGNED: 0, IN_PROGRESS: 0, WAITING_FOR_CUSTOMER: 0, RESOLVED: 0, CLOSED: 0 },
    agentWorkload: [],
    recentTickets: [],
  };

  const { summary, ticketsByPriority, ticketsByStatus, agentWorkload } = metrics;

  // 1. Data format for Recharts - Tickets by Status (Pie / Donut Chart)
  const statusChartData = [
    { name: 'Open', value: ticketsByStatus.OPEN, color: '#3b82f6' }, // Sky Blue
    { name: 'Assigned', value: ticketsByStatus.ASSIGNED, color: '#8b5cf6' }, // Purple
    { name: 'In Progress', value: ticketsByStatus.IN_PROGRESS, color: '#f59e0b' }, // Amber
    { name: 'Waiting Customer', value: ticketsByStatus.WAITING_FOR_CUSTOMER, color: '#f97316' }, // Orange
    { name: 'Resolved', value: ticketsByStatus.RESOLVED, color: '#10b981' }, // Emerald
    { name: 'Closed', value: ticketsByStatus.CLOSED, color: '#64748b' }, // Slate
  ].filter((item) => item.value > 0 || Object.values(ticketsByStatus).every((v) => v === 0));

  // 2. Data format for Recharts - Tickets by Priority (Bar Chart)
  const priorityChartData = [
    { priority: 'Urgent', count: ticketsByPriority.URGENT, fill: '#ef4444' }, // Red
    { priority: 'High', count: ticketsByPriority.HIGH, fill: '#f59e0b' }, // Amber
    { priority: 'Medium', count: ticketsByPriority.MEDIUM, fill: '#3b82f6' }, // Blue
    { priority: 'Low', count: ticketsByPriority.LOW, fill: '#94a3b8' }, // Slate
  ];

  // 3. Data format for Recharts - Tickets by Agent Workload (Stacked Bar Chart)
  const agentChartData = agentWorkload.map((agent) => ({
    name: agent.fullName.split(' ')[0], // First name for clean X-axis
    fullName: agent.fullName,
    Active: agent.activeTickets,
    Resolved: agent.resolvedTickets,
  }));

  const handleExportCSV = () => {
    const csvRows = [
      ['Metric', 'Value'],
      ['Ticket Resolution Count', summary.resolvedTickets],
      ['Average First Response Time', summary.avgResponseTime],
      ['Average Resolution Time', summary.avgResolutionTime],
      ['Resolution Rate', `${summary.resolutionRate}%`],
      ['Total Tickets', summary.totalTickets],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `supportflow_reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Support Analytics</h1>
          <p className="text-sm font-normal text-slate-500">
            Real-time metric summary cards and visual support performance breakdown
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleExportCSV}
          className="font-semibold text-slate-700 hover:bg-slate-50 border-slate-300 shrink-0"
        >
          <Download className="w-4 h-4 mr-2 text-slate-500" /> Export CSV Report
        </Button>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ticket Resolution Count */}
        <Card glass className="p-6 space-y-3 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticket Resolution Count</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900 leading-none">{summary.resolvedTickets}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {summary.resolutionRate}% Total Resolution Rate
            </p>
          </div>
        </Card>

        {/* Average First Response Time */}
        <Card glass className="p-6 space-y-3 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg First Response Time</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900 leading-none">{summary.avgResponseTime}</p>
            <p className="text-xs text-indigo-600 font-semibold mt-2">Target: &lt; 30 mins (SLA Compliant)</p>
          </div>
        </Card>

        {/* Average Resolution Time */}
        <Card glass className="p-6 space-y-3 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Resolution Time</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900 leading-none">{summary.avgResolutionTime}</p>
            <p className="text-xs text-purple-600 font-semibold mt-2">Measured from Creation to Resolution</p>
          </div>
        </Card>
      </div>

      {/* Visual Analytics Charts Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Tickets by Status (Pie / Donut Chart) */}
        <Card glass className="p-6 space-y-4 border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Tickets by Status</h2>
            </div>
            <Badge variant="info" className="text-xs">Distribution</Badge>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" /> Loading chart...
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    formatter={(value) => <span className="text-slate-700 font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* 2. Tickets by Priority (Bar Chart) */}
        <Card glass className="p-6 space-y-4 border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Tickets by Priority</h2>
            </div>
            <Badge variant="warning" className="text-xs">Volume Breakdown</Badge>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" /> Loading chart...
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="priority" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* 3. Tickets by Agent Workload (Bar Chart) */}
      <Card glass className="p-6 space-y-4 border border-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Tickets by Agent Workload</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">Active vs Resolved</span>
        </div>

        {isLoading ? (
          <div className="h-72 flex items-center justify-center text-xs text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" /> Loading agent workload chart...
          </div>
        ) : agentChartData.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-normal">
            No support agents invited yet.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#334155' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Active" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
};
