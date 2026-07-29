import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useTicketDetail,
  useUpdateTicketStatus,
  useAssignTicket,
  useAddInternalNote,
  useSocketChat,
} from '../hooks/useTickets';
import { useInvitations } from '../../invitations/hooks/useInvitations';
import { useAuthStore } from '../../../shared/store/authStore';
import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import {
  ArrowLeft,
  MessageSquare,
  Lock,
  History,
  Send,
  User,
  Clock,
  Shield,
  AlertTriangle,
  Building,
} from 'lucide-react';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const ticketId = id || '';

  const { user } = useAuthStore();
  const isAgentOrAdmin = user?.role === 'SUPPORT_AGENT' || user?.role === 'BUSINESS_ADMIN' || user?.role === 'PLATFORM_ADMIN';

  const { data, isLoading, isError, error } = useTicketDetail(ticketId);
  const teamQuery = useInvitations(isAgentOrAdmin);

  const updateStatusMutation = useUpdateTicketStatus();
  const assignAgentMutation = useAssignTicket();
  const addNoteMutation = useAddInternalNote();

  const { messages: socketMessages, typingUser, sendMessage, emitTyping } = useSocketChat(ticketId);

  const [chatInput, setChatInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [activeRightTab, setActiveRightTab] = useState<'notes' | 'timeline'>('notes');

  const ticket = data?.data;
  const agentsList = teamQuery.data?.data?.agents || [];

  // Combine initial database messages + real-time socket messages
  const initialMessages = ticket?.messages || [];
  const allMessages = [...initialMessages];
  socketMessages.forEach((sMsg) => {
    if (!allMessages.some((m) => m.id === sMsg.id)) {
      allMessages.push(sMsg);
    }
  });

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    addNoteMutation.mutate(
      { id: ticketId, content: noteInput.trim() },
      {
        onSuccess: () => setNoteInput(''),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading support ticket details...</p>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-2 max-w-xl mx-auto mt-8">
        <div className="flex items-center gap-2 font-bold text-rose-700">
          <AlertTriangle className="w-5 h-5" />
          <span>Ticket Not Found or Access Denied</span>
        </div>
        <p className="text-xs text-rose-600">{(error as any)?.response?.data?.message || 'Unable to view ticket.'}</p>
        <Link to="/customer/tickets" className="inline-block mt-2">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Ticket List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <Link
            to="/customer/tickets"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tickets
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-400 font-mono">
              #{ticket.ticketNumber || ticket.id.substring(0, 6)}
            </span>
            <h1 className="text-xl font-black text-slate-900">{ticket.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-800 border-slate-200 font-bold">
            {ticket.category.replace('_', ' ')}
          </Badge>
          <Badge variant={ticket.priority === 'URGENT' ? 'danger' : 'secondary'} className="text-xs font-bold">
            {ticket.priority} Priority
          </Badge>
        </div>
      </div>

      {/* Main Workspace Layout (Responsive Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT SIDEBAR: Controls & Ticket Metadata */}
        <div className="lg:col-span-3 space-y-4">
          <Card glass className="p-5 border border-slate-200 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ticket Controls</h3>

            {/* Status Control */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Ticket Status</label>
              {isAgentOrAdmin ? (
                <select
                  value={ticket.status}
                  onChange={(e) => updateStatusMutation.mutate({ id: ticketId, status: e.target.value })}
                  disabled={updateStatusMutation.isPending}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="OPEN">Open</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              ) : (
                <Badge variant="secondary" className="block text-center py-1.5 bg-slate-900 text-white font-bold">
                  {ticket.status.replace('_', ' ')}
                </Badge>
              )}
            </div>

            {/* Agent Assignment Control */}
            {isAgentOrAdmin && (
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700">Assigned Support Agent</label>
                <select
                  value={ticket.assignedAgentId || ''}
                  onChange={(e) => assignAgentMutation.mutate({ id: ticketId, assignedAgentId: e.target.value })}
                  disabled={assignAgentMutation.isPending}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
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

            {/* Customer Details Box */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Customer Info</span>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-700" />
                  {ticket.customer?.fullName}
                </div>
                <div className="text-slate-500 text-[11px] truncate font-medium">{ticket.customer?.email}</div>
                <div className="text-slate-400 text-[10px] pt-1 font-medium">
                  Created {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* CENTER PANEL: Real-Time Socket.IO Chat Box */}
        <div className="lg:col-span-6 flex flex-col min-h-[550px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-300" />
              <span className="text-xs font-bold tracking-wider uppercase">Real-Time Ticket Conversation</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Socket
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 space-y-3.5 overflow-y-auto max-h-[420px] bg-slate-50/50">
            {allMessages.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-12">No messages yet. Send a message to start conversation!</div>
            ) : (
              allMessages.map((msg: any, idx: number) => {
                const isMe = msg.senderId === user?.id;
                const isAgent = msg.sender?.role === 'SUPPORT_AGENT' || msg.sender?.role === 'BUSINESS_ADMIN';

                return (
                  <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                      <span className="font-bold text-slate-700">{msg.sender?.fullName || 'User'}</span>
                      {isAgent && <Badge variant="secondary" className="text-[9px] py-0 bg-slate-900 text-white font-bold">Agent</Badge>}
                      <span className="text-slate-400 text-[10px]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-slate-900 text-white rounded-br-none font-semibold'
                          : isAgent
                          ? 'bg-slate-800 text-white rounded-bl-none font-semibold'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}

            {typingUser && (
              <div className="text-[11px] font-bold text-slate-600 italic flex items-center gap-1.5 animate-pulse pt-1">
                <span className="w-2 h-2 rounded-full bg-slate-900" />
                {typingUser} is typing...
              </div>
            )}
          </div>

          {/* Chat Composer */}
          <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={chatInput}
              onChange={(e) => {
                setChatInput(e.target.value);
                emitTyping(true);
              }}
              onBlur={() => emitTyping(false)}
              className="flex-1 px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-medium"
            />
            <Button type="submit" variant="primary" size="md" className="bg-slate-900 hover:bg-slate-800 text-white font-bold shrink-0">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>

        {/* RIGHT PANEL: Agent Notes & Activity History */}
        <div className="lg:col-span-3 space-y-4">
          <Card glass className="p-4 border border-slate-200 space-y-3 min-h-[550px] flex flex-col">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 pb-2 gap-3">
              {isAgentOrAdmin && (
                <button
                  onClick={() => setActiveRightTab('notes')}
                  className={`text-xs font-black pb-1 flex items-center gap-1.5 transition-colors ${
                    activeRightTab === 'notes' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" /> Agent Notes
                </button>
              )}
              <button
                onClick={() => setActiveRightTab('timeline')}
                className={`text-xs font-black pb-1 flex items-center gap-1.5 transition-colors ${
                  activeRightTab === 'timeline' || !isAgentOrAdmin ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <History className="w-3.5 h-3.5 text-slate-700" /> Timeline
              </button>
            </div>

            {/* TAB 1: Agent Private Internal Notes */}
            {isAgentOrAdmin && activeRightTab === 'notes' && (
              <div className="flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Private to agents & admins. Hidden from customer.</span>
                  </div>

                  {ticket.internalNotes?.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No internal notes added yet.</p>
                  ) : (
                    ticket.internalNotes?.map((note: any) => (
                      <div key={note.id} className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{note.author?.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-800 text-xs font-medium leading-normal">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-slate-100">
                  <textarea
                    rows={2}
                    placeholder="Add private internal note..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                  <Button type="submit" variant="primary" size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold" isLoading={addNoteMutation.isPending}>
                    Save Note
                  </Button>
                </form>
              </div>
            )}

            {/* TAB 2: Immutable Activity Timeline */}
            {(activeRightTab === 'timeline' || !isAgentOrAdmin) && (
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[460px] pr-1">
                {ticket.activities?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No activity logged yet.</p>
                ) : (
                  ticket.activities?.map((act: any) => (
                    <div key={act.id} className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-extrabold text-slate-900">
                        <span className="text-[11px] font-mono text-slate-900">{act.action}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        By {act.actor?.fullName || 'System'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
