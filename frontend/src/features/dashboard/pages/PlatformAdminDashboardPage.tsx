import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { usePlatformDashboard } from '../hooks/useDashboard';
import { dashboardApi } from '../api/dashboard.api';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { DataTable, Column, FilterOption } from '../../../shared/components/ui/DataTable';
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
  PieChart as PieIcon,
  BarChart3,
  Sparkles,
} from 'lucide-react';

export const PlatformAdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = usePlatformDashboard();

  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Mutation for toggling business suspension
  const toggleSuspendMutation = useMutation({
    mutationFn: (businessId: string) => dashboardApi.toggleBusinessSuspension(businessId),
    onSuccess: (res) => {
      toast.success(res.message || 'Business status updated.');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'platform'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update business status.');
    },
  });

  const summary = data?.summary || {
    totalBusinesses: 0,
    activeSubscriptions: 0,
    monthlyRevenue: '$0',
    mrrNumber: 0,
    suspendedBusinesses: 0,
  };

  const planCounts = data?.businessesByPlan || { FREE: 0, STANDARD: 0, BUSINESS: 0 };
  const allBusinesses = data?.businesses || [];

  // Filter & Search Logic for Local Data Table
  const filteredBusinesses = allBusinesses.filter((b) => {
    const matchesSearch =
      !searchTerm ||
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = !planFilter || b.plan === planFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'SUSPENDED' ? b.isSuspended : !b.isSuspended && b.subscriptionStatus === statusFilter);

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Sort Logic
  const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
    let aVal: any = a[sortColumn as keyof typeof a];
    let bVal: any = b[sortColumn as keyof typeof b];

    if (sortColumn === 'createdAt') {
      aVal = new Date(a.createdAt).getTime();
      bVal = new Date(b.createdAt).getTime();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated View
  const paginatedBusinesses = sortedBusinesses.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(sortedBusinesses.length / limit) || 1;

  // Chart 1: Businesses by Plan Data
  const planChartData = [
    { name: 'Free Plan', value: planCounts.FREE, color: '#94a3b8' },
    { name: 'Standard ($49/m)', value: planCounts.STANDARD, color: '#6366f1' },
    { name: 'Business ($149/m)', value: planCounts.BUSINESS, color: '#a855f7' },
  ];

  // Chart 2: Revenue Distribution Data
  const revenueChartData = [
    { name: 'Free Plan', MRR: 0 },
    { name: 'Standard Plan', MRR: planCounts.STANDARD * 49 },
    { name: 'Business Plan', MRR: planCounts.BUSINESS * 149 },
  ];

  const filterOptions: FilterOption[] = [
    {
      key: 'plan',
      label: 'All Subscription Plans',
      value: planFilter,
      onChange: (val) => {
        setPlanFilter(val);
        setPage(1);
      },
      options: [
        { label: 'All Plans', value: '' },
        { label: 'Free Plan', value: 'FREE' },
        { label: 'Standard Plan', value: 'STANDARD' },
        { label: 'Business Plan', value: 'BUSINESS' },
      ],
    },
    {
      key: 'status',
      label: 'All Statuses',
      value: statusFilter,
      onChange: (val) => {
        setStatusFilter(val);
        setPage(1);
      },
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Suspended', value: 'SUSPENDED' },
      ],
    },
  ];

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Business Name & Owner',
      sortable: true,
      className: 'w-2/5 min-w-[240px]',
      render: (b) => (
        <div className="space-y-0.5">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{b.name}</span>
          </div>
          <div className="text-xs text-slate-500 font-normal">
            Owner: <strong className="font-semibold text-slate-700">{b.ownerName}</strong> ({b.ownerEmail})
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Subscription Plan',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (b) => (
        <Badge
          variant={b.plan === 'BUSINESS' ? 'purple' : b.plan === 'STANDARD' ? 'info' : 'secondary'}
          className="text-xs font-semibold uppercase"
        >
          {b.plan}
        </Badge>
      ),
    },
    {
      key: 'isSuspended',
      header: 'Status',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (b) =>
        b.isSuspended ? (
          <Badge variant="danger" className="text-xs font-semibold flex items-center gap-1">
            <Ban className="w-3 h-3" /> Suspended
          </Badge>
        ) : (
          <Badge variant="success" className="text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Active
          </Badge>
        ),
    },
    {
      key: 'usersCount',
      header: 'Team Members',
      className: 'whitespace-nowrap text-center',
      render: (b) => (
        <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>{b.usersCount} users</span>
        </div>
      ),
    },
    {
      key: 'ticketsCount',
      header: 'Total Tickets',
      className: 'whitespace-nowrap text-center',
      render: (b) => (
        <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
          <Ticket className="w-3.5 h-3.5 text-slate-500" />
          <span>{b.ticketsCount} tickets</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined Date',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (b) => (
        <span className="text-sm text-slate-600 font-normal">
          {new Date(b.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right whitespace-nowrap',
      render: (b) => (
        <Button
          variant={b.isSuspended ? 'success' : 'outline'}
          size="sm"
          className={
            b.isSuspended
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs'
              : 'border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs'
          }
          isLoading={toggleSuspendMutation.isPending && toggleSuspendMutation.variables === b.id}
          onClick={() => toggleSuspendMutation.mutate(b.id)}
        >
          {b.isSuspended ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activate
            </>
          ) : (
            <>
              <Ban className="w-3.5 h-3.5 mr-1" /> Suspend
            </>
          )}
        </Button>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-2">
        <div className="flex items-center gap-2 font-bold text-rose-700">
          <ShieldAlert className="w-5 h-5" />
          <span>Failed to load platform admin metrics</span>
        </div>
        <p className="text-xs text-rose-600">{(error as any)?.response?.data?.message || 'An error occurred.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Admin Overview</h1>
            <Badge variant="purple" className="text-xs font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-white" /> Global Control
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Real-time platform statistics across registered businesses, active subscriptions, revenue, and access control.
          </p>
        </div>
      </div>

      {/* 4 DYNAMIC REAL METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Businesses */}
        <Card glass className="p-5 flex items-center gap-4 border border-slate-200/80 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Businesses</p>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{summary.totalBusinesses}</p>
            )}
          </div>
        </Card>

        {/* 2. Active Subscriptions */}
        <Card glass className="p-5 flex items-center gap-4 border border-slate-200/80 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Subscriptions</p>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{summary.activeSubscriptions}</p>
            )}
          </div>
        </Card>

        {/* 3. Monthly Revenue (MRR) */}
        <Card glass className="p-5 flex items-center gap-4 border border-slate-200/80 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Revenue</p>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-purple-600 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{summary.monthlyRevenue}</p>
            )}
          </div>
        </Card>

        {/* 4. Suspended Businesses */}
        <Card glass className="p-5 flex items-center gap-4 border border-slate-200/80 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suspended Businesses</p>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-rose-600 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{summary.suspendedBusinesses}</p>
            )}
          </div>
        </Card>
      </div>

      {/* PLATFORM CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Businesses by Plan (Donut Chart) */}
        <Card glass className="lg:col-span-5 p-6 space-y-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Businesses by Plan</h2>
            </div>
            <Badge variant="purple" className="text-xs">Subscription Distribution</Badge>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" /> Loading plan data...
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {planChartData.map((entry, index) => (
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
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                    formatter={(value) => <span className="text-slate-700 font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* 2. Platform Revenue Breakdown (Bar Chart) */}
        <Card glass className="lg:col-span-7 p-6 space-y-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Monthly Revenue Contribution (MRR)</h2>
            </div>
            <Badge variant="success" className="text-xs">Revenue Breakdown</Badge>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" /> Loading revenue chart...
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                    formatter={(val: any) => [`$${val}`, 'Monthly MRR']}
                  />
                  <Bar dataKey="MRR" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* REGISTERED BUSINESSES DATA TABLE SECTION */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Registered Platform Businesses</h2>

        <DataTable
          title="Registered Businesses"
          totalCount={sortedBusinesses.length}
          data={paginatedBusinesses}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search business name, owner name, or owner email..."
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          filterOptions={filterOptions}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={(key) => {
            if (sortColumn === key) {
              setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            } else {
              setSortColumn(key);
              setSortDirection('desc');
            }
          }}
          page={page}
          limit={limit}
          total={sortedBusinesses.length}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          emptyMessage="No businesses match your search or filter criteria."
        />
      </div>
    </div>
  );
};
