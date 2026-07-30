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
    activeTab === 'UNREAD'
      ? notifications.filter((item: any) => !item.isRead)
      : notifications;

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
        className={`fixed inset-y-0 right-0 z-[1000] w-full sm:w-[420px] max-w-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out font-sans ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg text-slate-900 tracking-tight">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Bar with Filter Tabs & Quick Actions */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-2 shrink-0">
          {/* Unread / All Filter Tabs */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('UNREAD')}
              className={`relative pb-1 transition-colors ${
                activeTab === 'UNREAD' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Unread
              {activeTab === 'UNREAD' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`relative pb-1 transition-colors ${
                activeTab === 'ALL' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
              {activeTab === 'ALL' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5 text-xs">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-slate-600 hover:text-indigo-600 font-semibold flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-indigo-600" /> Mark all as read
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1 shadow-2xs transition-all"
            >
              View All <ArrowRight className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Drawer Body Notification Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-3 space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center my-auto">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 shadow-xs">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No notifications</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
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
                className={`p-3.5 rounded-2xl flex items-start gap-3.5 cursor-pointer transition-all ${
                  !item.isRead
                    ? 'bg-indigo-50/40 hover:bg-indigo-50/80 border border-indigo-100/60'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                    {!item.isRead && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-2">
                    {item.message}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium block pt-0.5">
                    {new Date(item.createdAt).toLocaleDateString()} at{' '}
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer displaying current date */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 text-center text-xs font-semibold text-slate-500 shrink-0">
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
