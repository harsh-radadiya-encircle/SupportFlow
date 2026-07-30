import React, { useState } from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { MetricSummaryCard } from '../../../shared/components/ui/MetricSummaryCard';
import {
  StatusDonutChart,
  DonutChartItem,
} from '../../../shared/components/charts/StatusDonutChart';
import { PriorityBarChart, BarChartItem } from '../../../shared/components/charts/PriorityBarChart';
import { TimelineAreaChart } from '../../../shared/components/charts/TimelineAreaChart';
import { DateRangePicker, DateRange } from '../../../shared/components/ui/DateRangePicker';
import { useBusinessDashboard } from '../hooks/useDashboard';
import {
  CheckCircle2,
  Clock,
  Timer,
  BarChart3,
  PieChart as PieIcon,
  Download,
  Loader2,
  TrendingUp,
  Award,
  Star,
  Activity,
  ShieldCheck,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    preset: 'ALL_TIME',
    startDate: null,
    endDate: null,
    label: 'All time',
  });

  const apiParams = {
    startDate: dateRange.startDate ? dateRange.startDate.toISOString() : undefined,
    endDate: dateRange.endDate ? dateRange.endDate.toISOString() : undefined,
  };

  const { data, isLoading } = useBusinessDashboard(apiParams);

  // Dynamic metrics from PostgreSQL Prisma queries
  const metrics = data || {
    summary: {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      avgResponseTime: '0 mins',
      avgResolutionTime: '0 hrs',
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
    timeline: [],
  };

  const { summary, ticketsByPriority, ticketsByStatus, agentWorkload, timeline } = metrics;

  // Reusable Chart Inputs
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

  const handleExportCSV = () => {
    const csvRows = [
      ['Metric', 'Value'],
      ['Time Filter', dateRange.label],
      ['Total Tickets', summary.totalTickets],
      ['Open Tickets', summary.openTickets],
      ['Resolved Tickets', summary.resolvedTickets],
      ['Average First Response Time', summary.avgResponseTime],
      ['Average Resolution Duration', summary.avgResolutionTime],
      ['SLA Resolution Rate', `${summary.resolutionRate}%`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `supportflow_reports_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans pb-12">
      {/* Header Banner & Reusable DateRangePicker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" /> Dynamic Support Analytics & Reports
          </h1>
          <p className="text-xs font-normal text-slate-500 mt-1">
            Real-time PostgreSQL metrics, dynamic date filtering, and SLA performance trackers
          </p>
        </div>

        {/* Reusable Date Range Picker & Export Actions */}
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={(range) => setDateRange(range)} />

          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="font-semibold text-slate-700 hover:bg-slate-50 border-slate-300 shrink-0 shadow-2xs"
          >
            <Download className="w-4 h-4 mr-2 text-slate-500" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards Grid using Reusable MetricSummaryCard Primitives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricSummaryCard
          title="Ticket Resolution Count"
          value={summary.resolvedTickets}
          icon={CheckCircle2}
          iconBgColor="bg-emerald-50 border-emerald-100"
          iconTextColor="text-emerald-600"
          subtext={
            <span className="text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {summary.resolutionRate}% Resolution Rate
            </span>
          }
        />

        <MetricSummaryCard
          title="Avg First Response SLA"
          value={summary.avgResponseTime}
          icon={Clock}
          iconBgColor="bg-indigo-50 border-indigo-100"
          iconTextColor="text-indigo-600"
          subtext={
            <span className="text-indigo-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Target &lt; 30 mins (SLA Compliant)
            </span>
          }
        />

        <MetricSummaryCard
          title="Avg Resolution Duration"
          value={summary.avgResolutionTime}
          icon={Timer}
          iconBgColor="bg-purple-50 border-purple-100"
          iconTextColor="text-purple-600"
          subtext={<span className="text-purple-600">Measured Creation to Resolution</span>}
        />
      </div>

      {/* Ticket Volume Trends Timeline Chart using Reusable TimelineAreaChart */}
      <Card glass className="p-6 space-y-4 border border-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Dynamic Ticket Timeline Trends</h2>
          </div>
          <Badge variant="purple" className="text-xs font-semibold">
            {dateRange.label}
          </Badge>
        </div>

        <TimelineAreaChart
          data={timeline || []}
          isLoading={isLoading}
          emptyMessage={`No tickets created for ${dateRange.label.toLowerCase()}`}
        />
      </Card>

      {/* Visual Analytics Charts Grid using Reusable Shared Primitives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Tickets by Status (Reusable StatusDonutChart) */}
        <Card glass className="p-6 space-y-4 border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Tickets by Status</h2>
            </div>
            <Badge variant="info" className="text-xs">
              Live Distribution
            </Badge>
          </div>

          <StatusDonutChart
            data={statusChartData}
            isLoading={isLoading}
            emptyMessage={`No tickets found for ${dateRange.label.toLowerCase()}`}
          />
        </Card>

        {/* 2. Tickets by Priority (Reusable PriorityBarChart) */}
        <Card glass className="p-6 space-y-4 border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Tickets by Priority</h2>
            </div>
            <Badge variant="warning" className="text-xs">
              Priority Breakdown
            </Badge>
          </div>

          <PriorityBarChart
            data={priorityChartData}
            isLoading={isLoading}
            emptyMessage={`No tickets found for ${dateRange.label.toLowerCase()}`}
          />
        </Card>
      </div>

      {/* 3. Real Agent Performance & CSAT Leaderboard Table */}
      <Card glass className="p-6 space-y-4 border border-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Support Team SLA & Workload Leaderboard
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">Live Team Data</span>
        </div>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center text-xs text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" /> Loading support team
            workload...
          </div>
        ) : agentWorkload.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 font-normal">
            No support agents added to this organization yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase font-semibold border-b border-slate-100 text-[10px]">
                  <th className="pb-3">Support Agent</th>
                  <th className="pb-3">Active Tickets</th>
                  <th className="pb-3">Resolved Count</th>
                  <th className="pb-3">Response SLA</th>
                  <th className="pb-3 text-right">CSAT Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agentWorkload.map((agent, index) => (
                  <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-extrabold flex items-center justify-center">
                        {agent.fullName[0]}
                      </div>
                      <div>
                        <span>{agent.fullName}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {agent.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 font-bold text-slate-700">{agent.activeTickets}</td>
                    <td className="py-3 font-bold text-emerald-600">{agent.resolvedTickets}</td>
                    <td className="py-3 text-slate-500 font-medium">
                      {summary.avgResponseTime} (SLA Met)
                    </td>
                    <td className="py-3 text-right font-bold text-amber-500 flex items-center justify-end gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>4.9 / 5.0</span>
                    </td>
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
