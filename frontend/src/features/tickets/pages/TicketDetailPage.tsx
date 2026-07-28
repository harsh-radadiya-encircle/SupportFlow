import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { useAuthStore } from '../../../shared/store/authStore';
import { TicketChatBox } from '../components/TicketChatBox';
import { InternalNotesTab } from '../components/InternalNotesTab';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { ArrowLeft, Lock, MessageSquare, History, CheckCircle } from 'lucide-react';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'chat' | 'internal_notes' | 'timeline'>('chat');

  const isAgentOrAdmin = user?.role === 'BUSINESS_ADMIN' || user?.role === 'SUPPORT_AGENT' || user?.role === 'PLATFORM_ADMIN';

  const [messages, setMessages] = useState([
    {
      id: 'm1',
      senderName: 'John Smith (Customer)',
      senderRole: 'CUSTOMER',
      content: 'Hi support team! Our WhatsApp sync stops updating after 10:00 PM every night.',
      time: '10:14 AM',
    },
    {
      id: 'm2',
      senderName: 'David Miller (Support Agent)',
      senderRole: 'SUPPORT_AGENT',
      content: 'Hello John! Thanks for reaching out. We are investigating the cron queue latency.',
      time: '10:20 AM',
    },
  ]);

  const [internalNotes, setInternalNotes] = useState([
    {
      id: 'n1',
      author: 'David Miller (Agent)',
      content: 'Checked Redis queue logs. Max memory limit reached at midnight. Scaling cluster memory.',
      time: '10:25 AM',
    },
  ]);

  const handleSendMessage = (text: string) => {
    setMessages([
      ...messages,
      {
        id: `m_${Date.now()}`,
        senderName: `${user?.fullName} (${user?.role?.replace('_', ' ')})`,
        senderRole: user?.role || 'CUSTOMER',
        content: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleAddInternalNote = (text: string) => {
    setInternalNotes([
      ...internalNotes,
      {
        id: `n_${Date.now()}`,
        author: `${user?.fullName} (${user?.role?.replace('_', ' ')})`,
        content: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to tickets list
        </button>

        {isAgentOrAdmin && (
          <div className="flex items-center gap-2">
            <select className="bg-white border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 shadow-sm focus:outline-none focus:border-indigo-600">
              <option value="IN_PROGRESS">Status: In Progress</option>
              <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <Button variant="outline" size="sm">
              <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
            </Button>
          </div>
        )}
      </div>

      <Card glass className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono font-bold text-slate-400">#1042</span>
              <Badge variant="warning">HIGH PRIORITY</Badge>
              <Badge variant="purple">IN PROGRESS</Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900">WhatsApp integration sync latency</h1>
          </div>

          <div className="text-right text-xs text-slate-500 space-y-1">
            <p>Customer: <span className="font-bold text-slate-900">John Smith</span></p>
            <p>Assigned Agent: <span className="font-bold text-indigo-600">David Miller</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Customer Live Chat ({messages.length})
          </button>

          {isAgentOrAdmin && (
            <button
              onClick={() => setActiveTab('internal_notes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'internal_notes'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Lock className="w-4 h-4 text-amber-100" /> Agent Private Notes ({internalNotes.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'timeline'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" /> Activity History
          </button>
        </div>

        {activeTab === 'chat' && (
          <div className="mt-4">
            <TicketChatBox
              messages={messages}
              currentUserRole={user?.role}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}

        {activeTab === 'internal_notes' && isAgentOrAdmin && (
          <div className="mt-4">
            <InternalNotesTab notes={internalNotes} onAddNote={handleAddInternalNote} />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="mt-4">
            <ActivityTimeline />
          </div>
        )}
      </Card>
    </div>
  );
};
