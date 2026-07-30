import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { formatFullDate, formatTimeAgo } from '../../../shared/lib/dateUtils';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications.tsx';
import {
  Bell,
  CheckCheck,
  Ticket,
  MessageSquare,
  Info,
  Clock,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'UNREAD' | 'ALL'>('UNREAD');

  const { data } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notificationsData = data?.data || { notifications: [], unreadCount: 0 };
  const { notifications, unreadCount } = notificationsData;

  // Filter notifications based on active tab
  const filteredNotifications =
    activeTab === 'UNREAD' ? notifications.filter((item: any) => !item.isRead) : notifications;

  // Lock body scroll when drawer is open to prevent page scroll conflict
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
        return <Ticket className="w-4 h-4 text-indigo-600" />;
      case 'TICKET_ASSIGNED':
        return <Ticket className="w-4 h-4 text-purple-600" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'STATUS_CHANGED':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'TICKET_RESOLVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  // Dynamic current date (e.g. Thursday, Jul 30, 2026)
  const formattedToday = formatFullDate(new Date());

  const drawerContent = (
    <div
      className={`fixed inset-0 z-[999] transition-all duration-300 ease-in-out ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Backdrop Overlay with Smooth Fade */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-Over Drawer Panel Sliding smoothly from Right */}
      <div
        className={`fixed inset-y-0 right-0 z-[1000] w-full sm:w-[420px] max-w-full glass-panel shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">Notifications</h2>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                Real-time updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 text-xs font-bold bg-indigo-600 text-white rounded-lg shadow-sm">
                {unreadCount} new
              </span>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar Bar with Filter Tabs & Quick Actions */}
        <div className="px-5 py-3 border-b border-slate-200/50 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2 shrink-0">
          {/* Unread / All Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('UNREAD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'UNREAD'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Unread
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ALL'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All
            </button>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3 text-xs">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Drawer Body Notification Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-transparent">
          {filteredNotifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center my-auto">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">All caught up!</h3>
              <p className="text-xs font-medium text-slate-500 mt-1 max-w-xs leading-relaxed">
                {activeTab === 'UNREAD'
                  ? 'You have read all your unread notifications.'
                  : 'No notifications available at this time.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item: any) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-4 rounded-2xl flex items-start gap-3 cursor-pointer transition-all ${
                  !item.isRead
                    ? 'bg-white shadow-sm border border-indigo-100 hover:border-indigo-200'
                    : 'bg-white/50 border border-slate-200/60 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm shrink-0">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-sm font-bold truncate ${!item.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                      {item.title}
                    </h4>
                    {!item.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 mt-1 shadow-sm shadow-indigo-600/50" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                    {item.message}
                  </p>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider pt-1">
                    {formatTimeAgo(new Date(item.createdAt))}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer displaying current date */}
        <div className="p-4 border-t border-slate-200/50 bg-slate-50/50 text-center text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
          {formattedToday}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative inline-block">
      {/* Bell Icon Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Render Drawer via React Portal directly into document.body to prevent layout overflow */}
      {createPortal(drawerContent, document.body)}
    </div>
  );
};
