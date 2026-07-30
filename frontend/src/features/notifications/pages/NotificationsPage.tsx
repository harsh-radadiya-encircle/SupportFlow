import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications.tsx';
import { DateRangePicker, DateRange } from '../../../shared/components/ui/DateRangePicker';
import { formatDateTime } from '../../../shared/lib/dateUtils';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { Card } from '../../../shared/components/ui/Card';
import {
  Bell,
  CheckCheck,
  Ticket,
  MessageSquare,
  Info,
  Clock,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'UNREAD' | 'ALL'>('UNREAD');
  const [dateRange, setDateRange] = useState<DateRange>({
    preset: 'ALL_TIME',
    startDate: null,
    endDate: null,
    label: 'All time',
  });

  const { data, isLoading } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notificationsData = data?.data || { notifications: [], unreadCount: 0 };
  const { notifications, unreadCount } = notificationsData;

  // Filter by active tab & date range
  const filteredNotifications = notifications.filter((item: any) => {
    // 1. Tab filter
    if (activeTab === 'UNREAD' && item.isRead) return false;

    // 2. Date Range filter
    if (dateRange.startDate || dateRange.endDate) {
      const itemDate = new Date(item.createdAt);
      if (dateRange.startDate && itemDate < dateRange.startDate) return false;
      if (dateRange.endDate && itemDate > dateRange.endDate) return false;
    }

    return true;
  });

  const handleNotificationClick = (item: any) => {
    if (!item.isRead) {
      markAsReadMutation.mutate(item.id);
    }
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
      {/* Page Title Header matching input_file_1.png */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" /> All Notifications
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Centralized activity log, ticket updates, and system notifications
          </p>
        </div>

        {/* Reusable Date Range Picker Primitive */}
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={(range) => setDateRange(range)} />

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-indigo-600" /> Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Control Tabs Header matching input_file_1.png */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('UNREAD')}
          className={`pb-3 transition-all relative ${
            activeTab === 'UNREAD'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full">
              {unreadCount}
            </span>
          )}
          {activeTab === 'UNREAD' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`pb-3 transition-all relative ${
            activeTab === 'ALL'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          All
          <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full">
            {notifications.length}
          </span>
          {activeTab === 'ALL' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Notification Cards Container matching input_file_1.png */}
      <Card className="min-h-[360px] p-6 flex flex-col justify-between">
        {filteredNotifications.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mb-3 shadow-xs border border-slate-200/80">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-xs text-slate-400 font-medium">
              No {activeTab === 'UNREAD' ? 'unread ' : ''}notifications for{' '}
              <span className="text-slate-600 font-semibold">{dateRange.label.toLowerCase()}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((item: any) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                  !item.isRead
                    ? 'bg-indigo-50/40 border-indigo-100 hover:bg-indigo-50/80'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                      {!item.isRead && (
                        <Badge variant="purple" className="text-[10px] py-0 px-1.5">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-normal leading-relaxed">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                </div>

                {item.ticketId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start sm:self-auto text-xs font-semibold text-slate-700 hover:bg-slate-100 border-slate-200 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationClick(item);
                    }}
                  >
                    View Ticket <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
