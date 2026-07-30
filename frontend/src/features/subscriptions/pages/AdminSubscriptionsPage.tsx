import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usePlatformDashboard } from '../../dashboard/hooks/useDashboard';
import { dashboardApi } from '../../dashboard/api/dashboard.api';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { DataTable, Column, FilterOption } from '../../../shared/components/ui/DataTable';
import {
  CreditCard,
  Building2,
  Ban,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  TrendingUp,
  DollarSign,
  Users,
  Ticket,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const AdminSubscriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = usePlatformDashboard();

  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
    monthlyRevenue: '₹0',
    mrrNumber: 0,
    suspendedBusinesses: 0,
  };

  const planCounts = data?.businessesByPlan || { FREE: 0, STANDARD: 0, BUSINESS: 0 };
  const allBusinesses = data?.businesses || [];

  const filteredBusinesses = allBusinesses.filter((b) => {
    const matchesSearch =
      !searchTerm ||
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = !planFilter || b.plan === planFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'SUSPENDED'
        ? b.isSuspended
        : statusFilter === 'ACTIVE'
          ? !b.isSuspended && b.subscriptionStatus === 'ACTIVE'
          : b.subscriptionStatus === statusFilter);

    return matchesSearch && matchesPlan && matchesStatus;
  });

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

  const paginatedBusinesses = sortedBusinesses.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(sortedBusinesses.length / limit) || 1;

  const filterOptions: FilterOption[] = [
    {
      key: 'plan',
      label: 'All Plans',
      value: planFilter,
      onChange: (val) => { setPlanFilter(val); setPage(1); },
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
      onChange: (val) => { setStatusFilter(val); setPage(1); },
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Suspended', value: 'SUSPENDED' },
        { label: 'Cancelled', value: 'CANCELLED' },
        { label: 'Expired', value: 'EXPIRED' },
      ],
    },
  ];

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Business & Owner',
      sortable: true,
      className: 'w-2/5 min-w-[220px]',
      render: (b) => (
        <div className="space-y-0.5">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            {b.name}
          </div>
          <div className="text-xs text-slate-500 font-normal leading-snug">
            {b.ownerName} · {b.ownerEmail}
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (b) => {
        const planConfig: Record<string, { label: string; variant: 'secondary' | 'info' | 'purple'; price: string }> = {
          FREE: { label: 'Free', variant: 'secondary', price: '₹0/mo' },
          STANDARD: { label: 'Standard', variant: 'info', price: '₹2,499/mo' },
          BUSINESS: { label: 'Business', variant: 'purple', price: '₹6,499/mo' },
        };
        const config = planConfig[b.plan] || planConfig.FREE;
        return (
          <div className="space-y-1">
            <Badge variant={config.variant} className="text-xs font-semibold">
              {config.label}
            </Badge>
            <p className="text-[11px] text-slate-400 font-medium">{config.price}</p>
          </div>
        );
      },
    },
    {
      key: 'subscriptionStatus',
      header: 'Sub. Status',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (b) => {
        if (b.isSuspended) {
          return (
            <Badge variant="danger" className="text-xs font-semibold flex items-center gap-1">
              <Ban className="w-3 h-3" /> Suspended
            </Badge>
          );
        }
        const statusMap: Record<string, { variant: 'success' | 'warning' | 'secondary' | 'danger'; label: string }> = {
          ACTIVE: { variant: 'success', label: 'Active' },
          CANCELLED: { variant: 'warning', label: 'Cancelled' },
          EXPIRED: { variant: 'secondary', label: 'Expired' },
          PAST_DUE: { variant: 'danger', label: 'Past Due' },
        };
        const s = statusMap[b.subscriptionStatus] || { variant: 'secondary', label: b.subscriptionStatus };
        return (
          <Badge variant={s.variant} className="text-xs font-semibold">
            {s.label}
          </Badge>
        );
      },
    },
    {
      key: 'usersCount',
      header: 'Members',
      className: 'whitespace-nowrap text-center',
      render: (b) => (
        <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
          <Users className="w-3.5 h-3.5 text-slate-400" /> {b.usersCount}
        </div>
      ),
    },
    {
      key: 'ticketsCount',
      header: 'Tickets',
      className: 'whitespace-nowrap text-center',
      render: (b) => (
        <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
          <Ticket className="w-3.5 h-3.5 text-slate-400" /> {b.ticketsCount}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (b) => (
        <div className="flex items-center gap-1 text-xs text-slate-500 font-normal">
          <Calendar className="w-3 h-3 text-slate-400" />
          {new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
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
            <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activate</>
          ) : (
            <><Ban className="w-3.5 h-3.5 mr-1" /> Suspend</>
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
          <span>Failed to load subscription data</span>
        </div>
        <p className="text-xs text-rose-600">
          {(error as any)?.response?.data?.message || 'An error occurred.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            Subscription Management
            <Badge variant="purple" className="text-xs font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-white" /> Platform Admin
            </Badge>
          </h1>
          <p className="text-sm text-slate-500 font-normal mt-1">
            Monitor all business subscriptions, revenue, and manage account access in real time.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Subs"
          value={summary.activeSubscriptions}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50 border border-emerald-100"
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Revenue"
          value={summary.monthlyRevenue}
          icon={<DollarSign className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50 border border-purple-100"
          isLoading={isLoading}
        />
        <StatCard
          title="Standard Plan"
          value={planCounts.STANDARD}
          sub="₹2,499/mo each"
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50 border border-indigo-100"
          isLoading={isLoading}
        />
        <StatCard
          title="Business Plan"
          value={planCounts.BUSINESS}
          sub="₹6,499/mo each"
          icon={<Sparkles className="w-5 h-5 text-amber-600" />}
          iconBg="bg-amber-50 border border-amber-100"
          isLoading={isLoading}
        />
      </div>

      {/* Plan Revenue Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { plan: 'FREE', label: 'Free Plan', count: planCounts.FREE, price: 0, color: 'bg-slate-100 border-slate-200', text: 'text-slate-600', badge: 'secondary' as const },
          { plan: 'STANDARD', label: 'Standard Plan', count: planCounts.STANDARD, price: 2499, color: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700', badge: 'info' as const },
          { plan: 'BUSINESS', label: 'Business Plan', count: planCounts.BUSINESS, price: 6499, color: 'bg-purple-50 border-purple-100', text: 'text-purple-700', badge: 'purple' as const },
        ].map((item) => (
          <div key={item.plan} className={`p-5 rounded-2xl border ${item.color} space-y-3`}>
            <div className="flex items-center justify-between">
              <Badge variant={item.badge} className="text-xs font-bold">{item.label}</Badge>
              <span className={`text-xs font-bold ${item.text}`}>
                {item.price > 0 ? `₹${item.price.toLocaleString('en-IN')}/mo` : 'Free'}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-extrabold text-slate-900">{isLoading ? '—' : item.count}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">businesses on this plan</p>
              </div>
              <div className={`text-right`}>
                <p className={`text-sm font-bold ${item.text}`}>
                  {isLoading ? '—' : `₹${(item.count * item.price).toLocaleString('en-IN')}`}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">MRR contribution</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Businesses Subscription Table */}
      <div>
        <DataTable
          title="All Business Subscriptions"
          totalCount={sortedBusinesses.length}
          data={paginatedBusinesses}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search by business name, owner name, or email..."
          onSearchChange={(val) => { setSearchTerm(val); setPage(1); }}
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
          onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
          emptyMessage="No subscriptions match your search or filter criteria."
        />
      </div>
    </div>
  );
};
