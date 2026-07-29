import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications';
import { Bell, CheckCheck, Ticket, MessageSquare, Info, Clock, CheckCircle2 } from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const { data } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notificationsData = data?.data || { notifications: [], unreadCount: 0 };
  const { notifications, unreadCount } = notificationsData;

  const handleNotificationClick = (item: any) => {
    if (!item.isRead) {
      markAsReadMutation.mutate(item.id);
    }
    setIsOpen(false);
    if (item.ticketId) {
      navigate(`/tickets/${item.ticketId}`);
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'NEW_TICKET':
        return <Ticket className="w-4 h-4 text-slate-900" />;
      case 'TICKET_ASSIGNED':
        return <Ticket className="w-4 h-4 text-slate-800" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-slate-800" />;
      case 'STATUS_CHANGED':
        return <Clock className="w-4 h-4 text-slate-700" />;
      case 'TICKET_RESOLVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-slate-900 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-300" />
              <span className="text-xs font-black uppercase tracking-wider">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-800 text-white rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                No notifications yet.
              </div>
            ) : (
              notifications.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    !item.isRead ? 'bg-slate-100/60 hover:bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-200/70 shrink-0 mt-0.5">{getIcon(item.type)}</div>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      {!item.isRead && <span className="w-2 h-2 rounded-full bg-slate-900 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{item.message}</p>
                    <span className="text-[10px] text-slate-400 font-normal block pt-1">
                      {new Date(item.createdAt).toLocaleDateString()} at{' '}
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
