import React from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { Plus, MessageSquare, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerTicketListPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Support Tickets</h1>
          <p className="text-sm font-medium text-slate-500">Track all your support requests, replies, and status.</p>
        </div>
        <Link to="/customer/tickets/new">
          <Button variant="primary">
            <Plus className="w-4 h-4" /> Create Support Ticket
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {[
          {
            id: '1',
            number: 1042,
            title: 'WhatsApp integration sync latency',
            category: 'TECHNICAL_ISSUE',
            priority: 'HIGH',
            status: 'IN_PROGRESS',
            updated: '10 mins ago',
          },
          {
            id: '4',
            number: 1038,
            title: 'Request for invoice copy for June',
            category: 'BILLING',
            priority: 'LOW',
            status: 'RESOLVED',
            updated: 'Yesterday',
          },
        ].map((t) => (
          <Card key={t.id} glass className="p-5 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400">#{t.number}</span>
                <Badge variant="default">{t.category.replace('_', ' ')}</Badge>
              </div>
              <Link to={`/tickets/${t.id}`} className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors block">
                {t.title}
              </Link>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Updated {t.updated}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant={t.priority === 'HIGH' ? 'warning' : 'default'}>{t.priority}</Badge>
              <Badge variant={t.status === 'RESOLVED' ? 'success' : 'purple'}>{t.status.replace('_', ' ')}</Badge>
              <Link to={`/tickets/${t.id}`}>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4" /> View Ticket
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
