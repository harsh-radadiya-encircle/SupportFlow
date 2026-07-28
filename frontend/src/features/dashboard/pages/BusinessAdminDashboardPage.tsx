import React from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { Ticket, Users, Clock, CheckCircle2, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BusinessAdminDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Business Dashboard</h1>
          <p className="text-sm font-medium text-slate-500">
            Real-time overview of ticket volume, agent response times, and system metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/business/team">
            <Button variant="outline" size="md">
              <Users className="w-4 h-4" />
              Manage Team
            </Button>
          </Link>
          <Link to="/customer/tickets/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4" />
              New Ticket
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glass className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tickets</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">128</p>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> +12% this week
            </span>
          </div>
        </Card>

        <Card glass className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Tickets</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">14</p>
            <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">Requires attention</span>
          </div>
        </Card>

        <Card glass className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">114</p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">89% resolution rate</span>
          </div>
        </Card>

        <Card glass className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg First Response</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">18 mins</p>
            <span className="text-[11px] text-purple-600 font-semibold mt-0.5 block">Target: &lt; 30 mins</span>
          </div>
        </Card>
      </div>

      <Card glass>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Customer Tickets</h2>
          <Link to="/business/tickets" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
            View All Tickets &rarr;
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {[
            {
              id: '1',
              number: 1042,
              title: 'WhatsApp integration sync latency',
              customer: 'John Smith',
              priority: 'HIGH',
              status: 'IN_PROGRESS',
              time: '10 mins ago',
            },
            {
              id: '2',
              number: 1041,
              title: 'Billing statement download fails',
              customer: 'Elena Rostova',
              priority: 'MEDIUM',
              status: 'OPEN',
              time: '35 mins ago',
            },
            {
              id: '3',
              number: 1040,
              title: 'API Rate limit exceeded on webhooks',
              customer: 'Michael Chang',
              priority: 'URGENT',
              status: 'ASSIGNED',
              time: '1 hour ago',
            },
          ].map((ticket) => (
            <div key={ticket.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-slate-400">#{ticket.number}</span>
                <div>
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                  >
                    {ticket.title}
                  </Link>
                  <p className="text-xs text-slate-500 font-medium">Raised by {ticket.customer} • {ticket.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    ticket.priority === 'URGENT' || ticket.priority === 'HIGH' ? 'danger' : 'warning'
                  }
                >
                  {ticket.priority}
                </Badge>
                <Badge variant={ticket.status === 'OPEN' ? 'info' : 'purple'}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
