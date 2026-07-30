import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '../../../shared/components/ui/Badge';

interface TicketHeaderProps {
  ticket: any;
}

export const TicketHeader: React.FC<TicketHeaderProps> = ({ ticket }) => {
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
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Link
            to="/customer/tickets"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tickets
          </Link>
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <span className="text-sm font-bold text-slate-400">
              #{ticket.ticketNumber || ticket.id?.substring(0, 6)}
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {ticket.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Badge variant="ghost" className="text-xs font-semibold text-slate-600 capitalize">
            {ticket.category ? ticket.category.toLowerCase().replace('_', ' ') : 'General'}
          </Badge>
          {getPriorityBadge(ticket.priority)}
          {getStatusBadge(ticket.status)}
        </div>
      </div>

      {ticket.description && (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
            {ticket.description}
          </p>
        </div>
      )}
    </div>
  );
};
