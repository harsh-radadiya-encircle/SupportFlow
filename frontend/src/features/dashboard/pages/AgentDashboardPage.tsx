import React from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { useAgentDashboard } from '../hooks/useDashboard';
import {
  Ticket,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageSquare,
  Bell,
  ChevronRight,
  User,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AgentDashboardPage: React.FC = () => {
  const { data, isLoading } = useAgentDashboard();

  const metrics = data || {
    summary: {
      assignedTickets: 0,
      openTickets: 0,
      waitingTickets: 0,
      resolvedTickets: 0,
    },
    recentMessages: [],
    notifications: [],
  };

  const { summary, recentMessages, notifications } = metrics;

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Agent Portal</h1>
          <p className="text-sm font-normal text-slate-500">
            Real-time overview of your assigned tickets, recent messages, and ticket notifications
          </p>
        </div>
        <Link to="/agent/tickets">
          <Button
            variant="primary"
            size="md"
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md"
          >
            <Ticket className="w-4 h-4 mr-1.5" />
            View Assigned Queue
          </Button>
        </Link>
      </div>

      {/* 1-4. Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assigned Tickets */}
        <Card glass className="p-5 space-y-2 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Assigned Tickets
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900 leading-none">
              {summary.assignedTickets}
            </p>
            <p className="text-xs text-slate-500 font-normal mt-1.5">Total tickets in your queue</p>
          </div>
        </Card>

        {/* Open Tickets */}
        <Card glass className="p-5 space-y-2 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Open Tickets
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900 leading-none">{summary.openTickets}</p>
            <p className="text-xs text-amber-600 font-semibold mt-1.5">
              Requires immediate agent reply
            </p>
          </div>
        </Card>

        {/* Waiting Tickets */}
        <Card glass className="p-5 space-y-2 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Waiting Tickets
            </span>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900 leading-none">
              {summary.waitingTickets}
            </p>
            <p className="text-xs text-sky-600 font-semibold mt-1.5">Pending customer response</p>
          </div>
        </Card>

        {/* Resolved Tickets */}
        <Card glass className="p-5 space-y-2 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Resolved Tickets
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900 leading-none">
              {summary.resolvedTickets}
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-1.5">Successfully completed</p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Recent Messages & Ticket Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Recent Messages */}
        <div className="lg:col-span-7">
          <Card glass className="p-6 space-y-4 border border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Recent Messages</h2>
              </div>
              <Badge variant="info" className="text-[10px]">
                Live Stream
              </Badge>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Loading recent
                messages...
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-normal">
                No recent message activity on your assigned tickets.
              </div>
            ) : (
              <div className="space-y-3 divide-y divide-slate-100">
                {recentMessages.map((msg) => (
                  <div key={msg.id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                          {msg.sender?.fullName?.charAt(0) || 'U'}
                        </div>
                        <span className="font-semibold text-slate-900">
                          {msg.sender?.fullName || 'User'}
                        </span>
                        <Badge
                          variant={msg.sender?.role === 'CUSTOMER' ? 'warning' : 'purple'}
                          className="text-[9px] px-1.5 py-0"
                        >
                          {msg.sender?.role}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-normal">
                      "{msg.content}"
                    </p>

                    <div className="flex justify-end pt-0.5">
                      <Link
                        to={`/tickets/${msg.ticket?.id}`}
                        className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        #{msg.ticket?.ticketNumber || 'Ticket'} — {msg.ticket?.title}{' '}
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right (5 cols): Ticket Notifications */}
        <div className="lg:col-span-5">
          <Card glass className="p-6 space-y-4 border border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">Ticket Notifications</h2>
              </div>
              <Badge variant="purple" className="text-xs">
                Activity Feed
              </Badge>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Loading
                notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-normal">
                No notifications received yet.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border transition-colors space-y-1 ${
                      n.isRead
                        ? 'bg-white border-slate-200/80'
                        : 'bg-indigo-50/50 border-indigo-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-normal">{n.message}</p>
                    {n.ticketId && (
                      <div className="pt-1 text-right">
                        <Link
                          to={`/tickets/${n.ticketId}`}
                          className="text-[11px] font-semibold text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                        >
                          Open Ticket <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
