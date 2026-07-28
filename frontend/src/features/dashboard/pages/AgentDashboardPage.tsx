import React from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Ticket, Clock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AgentDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Support Agent Portal</h1>
        <p className="text-sm font-medium text-slate-500">
          Manage your assigned customer conversations, reply in real time, and resolve tickets.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card glass className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned to Me</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">8</p>
          </div>
        </Card>

        <Card glass className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Waiting Customer Response</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">3</p>
          </div>
        </Card>

        <Card glass className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved Today</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">5</p>
          </div>
        </Card>
      </div>

      <Card glass>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Assigned Support Queue</h2>
        <div className="space-y-3">
          {[
            {
              id: '1',
              number: 1042,
              title: 'WhatsApp integration sync latency',
              customer: 'John Smith',
              priority: 'HIGH',
              status: 'IN_PROGRESS',
            },
            {
              id: '3',
              number: 1040,
              title: 'API Rate limit exceeded on webhooks',
              customer: 'Michael Chang',
              priority: 'URGENT',
              status: 'ASSIGNED',
            },
          ].map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-500/50 transition-colors flex items-center justify-between gap-4 shadow-sm"
            >
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">#{t.number}</span>
                <Link to={`/tickets/${t.id}`} className="font-bold text-slate-900 block hover:text-indigo-600">
                  {t.title}
                </Link>
                <span className="text-xs text-slate-500 font-medium">Customer: {t.customer}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={t.priority === 'URGENT' ? 'danger' : 'warning'}>{t.priority}</Badge>
                <Badge variant="purple">{t.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
