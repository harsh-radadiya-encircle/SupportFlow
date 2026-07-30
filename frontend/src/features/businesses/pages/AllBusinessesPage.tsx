import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usePlatformDashboard } from '../../dashboard/hooks/useDashboard';
import { dashboardApi } from '../../dashboard/api/dashboard.api';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { DataTable, Column, FilterOption } from '../../../shared/components/ui/DataTable';
import { Building2, CheckCircle2, Ban, Users, Ticket, Sparkles, AlertTriangle } from 'lucide-react';

export const AllBusinessesPage: React.FC = () => {
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
        : !b.isSuspended && b.subscriptionStatus === statusFilter);

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
            Owner: <strong className="font-semibold text-slate-700">{b.ownerName}</strong> (
            {b.ownerEmail})
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
          <AlertTriangle className="w-5 h-5" />
          <span>Failed to load registered businesses</span>
        </div>
        <p className="text-xs text-rose-600">
          {(error as any)?.response?.data?.message || 'An error occurred.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              All Registered Businesses
            </h1>
            <Badge variant="purple" className="text-xs font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-white" /> Business Directory
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Manage organization accounts, monitor subscription plans, and toggle business suspension
            status.
          </p>
        </div>
      </div>

      {/* Universal DataTable Integration */}
      <DataTable
        title="Businesses"
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
        emptyMessage="No registered businesses match your search or filter criteria."
      />
    </div>
  );
};
