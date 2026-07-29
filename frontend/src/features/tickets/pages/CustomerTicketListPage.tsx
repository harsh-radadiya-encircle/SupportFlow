import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Pagination } from '../../../shared/components/ui/Pagination';
import {
  Ticket,
  Plus,
  Search,
  MessageSquare,
  Clock,
  User,
  AlertTriangle,
  ChevronRight,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export const CustomerTicketListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Debounce search input by 400ms to prevent screen flickering during typing
  const debouncedSearch = useDebounce(searchTerm, 400);

  const { data, isLoading, isFetching, isError, error } = useTickets({
    search: debouncedSearch.trim() || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    category: categoryFilter || undefined,
    page,
    limit,
  });

  const tickets = data?.data || [];
  const paginationMeta = data?.meta || { page: 1, limit: 15, total: 0, totalPages: 1 };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setPage(1);
  };

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

  // Only show full loading spinner on initial mount when no data exists
  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading support tickets...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-2">
        <div className="flex items-center gap-2 font-bold text-rose-700">
          <AlertTriangle className="w-5 h-5" />
          <span>Failed to load support tickets</span>
        </div>
        <p className="text-xs text-rose-600">{(error as any)?.response?.data?.message || 'An error occurred.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Support Tickets</h1>
            <Badge variant="purple" className="text-xs font-bold">
              {paginationMeta.total} Total
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Search, filter, and track support requests in real time
          </p>
        </div>

        <Link to="/customer/tickets/new">
          <Button variant="primary" className="bg-slate-900 hover:bg-slate-800 text-white font-bold shrink-0 shadow-md">
            <Plus className="w-4 h-4 mr-1.5" /> Create Support Ticket
          </Button>
        </Link>
      </div>

      {/* Filter Bar with Debounced Input */}
      <Card glass className="p-4 border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Debounced Search Box with Smooth Inline Loader */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets by title or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-medium"
            />
            {isFetching && (
              <Loader2 className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400 animate-spin" />
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-700 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-700 font-medium"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-700 font-medium"
          >
            <option value="">All Categories</option>
            <option value="GENERAL_INQUIRY">General Inquiry</option>
            <option value="TECHNICAL_ISSUE">Technical Issue</option>
            <option value="BILLING">Billing</option>
            <option value="FEATURE_REQUEST">Feature Request</option>
            <option value="BUG_REPORT">Bug Report</option>
          </select>
        </div>

        {(searchTerm || statusFilter || priorityFilter || categoryFilter) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          </div>
        )}
      </Card>

      {/* Tickets List View */}
      {tickets.length === 0 ? (
        <Card glass className="p-12 text-center space-y-3 border border-slate-200">
          <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No support tickets found</h3>
          <p className="text-xs text-slate-500">No tickets match your search or filter criteria.</p>
          <Link to="/customer/tickets/new" className="inline-block mt-2">
            <Button variant="primary" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Create Your First Ticket
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {tickets.map((ticket: any) => (
              <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="block group">
                <Card
                  glass
                  className="p-5 border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-400 font-mono">
                          #{ticket.ticketNumber || ticket.id.substring(0, 6)}
                        </span>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                        <Badge variant="ghost" className="text-[11px] text-slate-500 font-bold">
                          {ticket.category.replace('_', ' ')}
                        </Badge>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {ticket.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-1 font-medium">{ticket.description}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ticket.customer?.fullName || 'Customer'}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{ticket._count?.messages || 0} messages</span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Reusable Pagination Component */}
          <Pagination
            page={paginationMeta.page}
            limit={paginationMeta.limit}
            total={paginationMeta.total}
            totalPages={paginationMeta.totalPages}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};
