import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { DataTable, Column, FilterOption } from '../../../shared/components/ui/DataTable';
import { Plus, ChevronRight, AlertTriangle, User } from 'lucide-react';

export const CustomerTicketListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, isError, error } = useTickets({
    search: searchTerm.trim() || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    category: categoryFilter || undefined,
    page,
    limit,
  });

  const tickets = data?.data || [];
  const paginationMeta = data?.meta || { page: 1, limit: 15, total: 0, totalPages: 1 };

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

  const filterOptions: FilterOption[] = [
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
        { label: 'Open', value: 'OPEN' },
        { label: 'Assigned', value: 'ASSIGNED' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Waiting Customer', value: 'WAITING_FOR_CUSTOMER' },
        { label: 'Resolved', value: 'RESOLVED' },
        { label: 'Closed', value: 'CLOSED' },
      ],
    },
    {
      key: 'priority',
      label: 'All Priorities',
      value: priorityFilter,
      onChange: (val) => {
        setPriorityFilter(val);
        setPage(1);
      },
      options: [
        { label: 'All Priorities', value: '' },
        { label: 'Urgent', value: 'URGENT' },
        { label: 'High', value: 'HIGH' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Low', value: 'LOW' },
      ],
    },
    {
      key: 'category',
      label: 'All Categories',
      value: categoryFilter,
      onChange: (val) => {
        setCategoryFilter(val);
        setPage(1);
      },
      options: [
        { label: 'All Categories', value: '' },
        { label: 'General Inquiry', value: 'GENERAL_INQUIRY' },
        { label: 'Technical Issue', value: 'TECHNICAL_ISSUE' },
        { label: 'Billing', value: 'BILLING' },
        { label: 'Feature Request', value: 'FEATURE_REQUEST' },
        { label: 'Bug Report', value: 'BUG_REPORT' },
      ],
    },
  ];

  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Subject & Description',
      sortable: true,
      className: 'w-2/5 min-w-[280px]',
      render: (ticket) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400 shrink-0">
              #{ticket.ticketNumber || ticket.id.substring(0, 6)}
            </span>
            <Link
              to={`/tickets/${ticket.id}`}
              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-sm truncate"
            >
              {ticket.title}
            </Link>
          </div>
          <p className="text-xs text-slate-500 line-clamp-1 font-normal">{ticket.description}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (ticket) => (
        <Badge
          variant="ghost"
          className="text-xs font-semibold text-slate-600 capitalize whitespace-nowrap"
        >
          {ticket.category ? ticket.category.toLowerCase().replace('_', ' ') : 'General'}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (ticket) => getPriorityBadge(ticket.priority),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (ticket) => getStatusBadge(ticket.status),
    },
    {
      key: 'customer',
      header: 'Customer',
      className: 'whitespace-nowrap',
      render: (ticket) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-800 font-medium whitespace-nowrap">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{ticket.customer?.fullName || 'Customer'}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (ticket) => (
        <span className="text-sm text-slate-600 font-normal whitespace-nowrap">
          {new Date(ticket.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right whitespace-nowrap',
      render: (ticket) => (
        <Link
          to={`/tickets/${ticket.id}`}
          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all text-xs font-semibold whitespace-nowrap shadow-2xs"
        >
          View Details <ChevronRight className="w-4 h-4 shrink-0" />
        </Link>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-2">
        <div className="flex items-center gap-2 font-bold text-rose-700">
          <AlertTriangle className="w-5 h-5" />
          <span>Failed to load support tickets</span>
        </div>
        <p className="text-xs text-rose-600">
          {(error as any)?.response?.data?.message || 'An error occurred.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Support Tickets</h1>
            <Badge variant="purple" className="text-xs font-bold">
              {paginationMeta.total} Total
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Search, filter, and track support requests in real time
          </p>
        </div>

        <Link to="/customer/tickets/new">
          <Button
            variant="primary"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold shrink-0 shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create Support Ticket
          </Button>
        </Link>
      </div>

      {/* Shared Reusable Data Table Component */}
      <DataTable
        title="Tickets"
        totalCount={paginationMeta.total}
        data={tickets}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search tickets by subject or description..."
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
        page={paginationMeta.page}
        limit={paginationMeta.limit}
        total={paginationMeta.total}
        totalPages={paginationMeta.totalPages}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage="No support tickets match your search or filter criteria."
      />
    </div>
  );
};
