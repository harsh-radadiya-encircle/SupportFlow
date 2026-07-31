import React from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { User, Star, CheckCircle2 } from 'lucide-react';
import { Controller, UseFormReturn } from 'react-hook-form';

interface TicketMetadataSidebarProps {
  ticket: any;
  agentsList: any[];
  isAgentOrAdmin: boolean;
  updateStatusMutation: any;
  assignAgentMutation: any;
  submitCsatMutation: any;
  csatForm: UseFormReturn<any>;
  onSubmitCsat: (data: any) => void;
  participantStatus?: 'online' | 'offline';
}

export const TicketMetadataSidebar: React.FC<TicketMetadataSidebarProps> = ({
  ticket,
  agentsList,
  isAgentOrAdmin,
  updateStatusMutation,
  assignAgentMutation,
  submitCsatMutation,
  csatForm,
  onSubmitCsat,
  participantStatus = 'offline',
}) => {
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

  return (
    <Card glass className="p-5 border border-slate-200/80 space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        Ticket Management
      </h3>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700">Ticket Status</label>
        {isAgentOrAdmin ? (
          <select
            value={ticket.status}
            onChange={(e) =>
              updateStatusMutation.mutate({ id: ticket.id, status: e.target.value })
            }
            disabled={updateStatusMutation.isPending}
            className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white shadow-2xs"
          >
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        ) : (
          <div className="py-1">{getStatusBadge(ticket.status)}</div>
        )}
      </div>

      {isAgentOrAdmin && (
        <div className="space-y-1.5 pt-3 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-700">
            Assigned Support Agent
          </label>
          <select
            value={ticket.assignedAgentId || ''}
            onChange={(e) =>
              assignAgentMutation.mutate({ id: ticket.id, assignedAgentId: e.target.value })
            }
            disabled={assignAgentMutation.isPending}
            className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white shadow-2xs"
          >
            <option value="">Unassigned</option>
            {agentsList.map((ag: any) => (
              <option key={ag.id} value={ag.id}>
                {ag.fullName} ({ag.role === 'BUSINESS_ADMIN' ? 'Admin' : 'Agent'})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Customer Details
          </span>
          {isAgentOrAdmin && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              <span className={`w-1.5 h-1.5 rounded-full ${participantStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className={participantStatus === 'online' ? 'text-emerald-600' : 'text-slate-500'}>
                {participantStatus === 'online' ? 'Online' : 'Offline'}
              </span>
            </span>
          )}
        </div>
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1 text-xs">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            {ticket.customer?.fullName || 'Unknown Customer'}
          </div>
          <div className="text-slate-500 font-medium pl-5 truncate">
            {ticket.customer?.email}
          </div>
          {ticket.customer?.phone && (
            <div className="text-slate-500 font-medium pl-5 truncate">
              {ticket.customer.phone}
            </div>
          )}
        </div>
      </div>

      {!isAgentOrAdmin && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
        <div className="pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
            Rate Your Support
          </span>
          {ticket.csatScore ? (
            <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 space-y-2 w-full">
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= ticket.csatScore!
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200 fill-slate-100'
                    }`}
                  />
                ))}
              </div>
              {ticket.csatComment && (
                <p className="text-[11px] text-slate-700 font-medium italic mt-2 text-center">
                  "{ticket.csatComment}"
                </p>
              )}
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider pt-2 flex justify-center items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Feedback Submitted
              </p>
            </div>
          ) : (
            <form
              onSubmit={csatForm.handleSubmit(onSubmitCsat)}
              className="space-y-3 w-full"
            >
              <Controller
                name="score"
                control={csatForm.control}
                render={({ field }) => (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => field.onChange(star)}
                          className="transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              star <= field.value
                                ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                                : 'text-slate-200 hover:text-amber-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {csatForm.formState.errors.score && (
                      <p className="text-[10px] text-rose-600 font-bold">{csatForm.formState.errors.score.message as string}</p>
                    )}
                  </div>
                )}
              />
              <textarea
                {...csatForm.register('comment')}
                placeholder="Tell us what you loved, or how we can improve (optional)..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none h-16"
              />
              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-xl text-xs"
                disabled={submitCsatMutation.isPending}
              >
                {submitCsatMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </form>
          )}
        </div>
      )}
    </Card>
  );
};
