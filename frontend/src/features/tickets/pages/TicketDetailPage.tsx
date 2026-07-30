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
  Lock,
  History,
  Send,
  User,
  Clock,
  Shield,
  AlertTriangle,
  Headset,
} from 'lucide-react';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const ticketId = id || '';

  const { user } = useAuthStore();
  const isAgentOrAdmin =
    user?.role === 'SUPPORT_AGENT' || user?.role === 'BUSINESS_ADMIN' || user?.role === 'PLATFORM_ADMIN';

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
    <div className="space-y-6 font-sans">
      {/* Top Header Banner Card */}
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
                #{ticket.ticketNumber || ticket.id.substring(0, 6)}
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{ticket.title}</h1>
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

        {/* Ticket Description snippet */}
        {ticket.description && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
              {ticket.description}
            </p>
          </div>
        )}
      </div>

      {/* Main Workspace Grid: Chat (8 cols) & Side Controls (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / MAIN COLUMN: Light-Themed Real-Time Support Chat */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden h-[580px]">
          {/* Light Slate Chat Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
                <Headset className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block leading-none">Real-Time Support Conversation</span>
                <span className="text-xs text-slate-500 font-normal">Ticket #{ticket.ticketNumber || ticket.id.substring(0, 6)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Socket
            </div>
          </div>

          {/* Messages Stream Container */}
          <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-slate-50/40">
            {allMessages.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-20 font-normal">
                No messages yet. Type a message below to start the conversation!
              </div>
            ) : (
              allMessages.map((msg: any, idx: number) => {
                const isMe = msg.senderId === user?.id;
                const isAgent = msg.sender?.role === 'SUPPORT_AGENT' || msg.sender?.role === 'BUSINESS_ADMIN';

                return (
                  <div key={msg.id || idx} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* User Avatar Circle */}
                    <div
                      className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border shadow-2xs ${
                        isMe
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : isAgent
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {msg.sender?.fullName ? msg.sender.fullName[0].toUpperCase() : 'U'}
                    </div>

                    <div className={`space-y-1 max-w-[80%] ${isMe ? 'items-end text-right' : 'items-start'}`}>
                      <div className={`flex items-center gap-2 text-xs ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="font-semibold text-slate-800">{msg.sender?.fullName || 'User'}</span>
                        <Badge variant={isAgent ? 'purple' : 'warning'} className="text-[10px] px-1.5 py-0">
                          {isAgent ? 'Support Team' : 'Customer'}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-2xs ${
                          isMe
                            ? 'bg-indigo-50 border border-indigo-100 text-indigo-950 rounded-tr-none'
                            : 'bg-white text-slate-900 border border-slate-200/80 rounded-tl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {typingUser && (
              <div className="text-xs font-semibold text-indigo-600 italic flex items-center gap-2 animate-pulse pt-1">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                {typingUser} is typing a response...
              </div>
            )}
          </div>

          {/* Chat Composer Input */}
          <form onSubmit={handleSendChat} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3 shrink-0">
            <input
              type="text"
              placeholder="Type your message..."
              value={chatInput}
              onChange={(e) => {
                setChatInput(e.target.value);
                emitTyping(true);
              }}
              onBlur={() => emitTyping(false)}
              className="flex-1 px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white font-medium shadow-2xs"
            />
            <Button
              type="submit"
              variant="outline"
              size="md"
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 font-bold py-3 px-5 rounded-xl shadow-2xs shrink-0 transition-all"
            >
              <Send className="w-4 h-4 mr-1.5" /> Send
            </Button>
          </form>
        </div>

        {/* RIGHT COLUMN: Controls, Customer Info & Internal Notes */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Ticket Status & Agent Controls */}
          <Card glass className="p-5 border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Management</h3>

            {/* Status Control */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Ticket Status</label>
              {isAgentOrAdmin ? (
                <select
                  value={ticket.status}
                  onChange={(e) => updateStatusMutation.mutate({ id: ticketId, status: e.target.value })}
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

            {/* Agent Assignment Control */}
            {isAgentOrAdmin && (
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-700">Assigned Support Agent</label>
                <select
                  value={ticket.assignedAgentId || ''}
                  onChange={(e) => assignAgentMutation.mutate({ id: ticketId, assignedAgentId: e.target.value })}
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

            {/* Customer Details Box */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Details</span>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  {ticket.customer?.fullName || 'Customer'}
                </div>
                <div className="text-slate-500 font-normal truncate">{ticket.customer?.email}</div>
                <div className="text-slate-400 text-[10px] pt-1 font-normal flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Created {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Agent Private Internal Notes & Audit Timeline */}
          <Card glass className="p-5 border border-slate-200/80 space-y-4 flex flex-col">
            {/* Tabs Switcher Header */}
            <div className="flex border-b border-slate-100 pb-2 gap-4">
              {isAgentOrAdmin && (
                <button
                  onClick={() => setActiveRightTab('notes')}
                  className={`text-xs font-bold pb-1 flex items-center gap-1.5 transition-colors ${
                    activeRightTab === 'notes'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" /> Private Notes
                </button>
              )}
              <button
                onClick={() => setActiveRightTab('timeline')}
                className={`text-xs font-bold pb-1 flex items-center gap-1.5 transition-colors ${
                  activeRightTab === 'timeline' || !isAgentOrAdmin
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <History className="w-3.5 h-3.5 text-slate-500" /> Activity Log
              </button>
            </div>

            {/* TAB 1: Private Agent Internal Notes */}
            {isAgentOrAdmin && activeRightTab === 'notes' && (
              <div className="space-y-3">
                <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Private internal notes are hidden from customer.</span>
                  </div>

                  {ticket.internalNotes?.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4 font-normal">No internal notes added yet.</p>
                  ) : (
                    ticket.internalNotes?.map((note: any) => (
                      <div key={note.id} className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{note.author?.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-800 font-normal leading-relaxed">{note.content}</p>
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
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white font-medium shadow-2xs"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-2.5 rounded-xl shadow-2xs border-slate-200"
                    isLoading={addNoteMutation.isPending}
                  >
                    Save Note
                  </Button>
                </form>
              </div>
            )}

            {/* TAB 2: Immutable Activity Log */}
            {(activeRightTab === 'timeline' || !isAgentOrAdmin) && (
              <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1">
                {ticket.activities?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 font-normal">No activity logged yet.</p>
                ) : (
                  ticket.activities?.map((act: any) => (
                    <div key={act.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{act.action}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-500 font-normal">
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
