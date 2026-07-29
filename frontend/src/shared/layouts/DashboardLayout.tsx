import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { auth } from '../config/firebase';
import { Badge } from '../components/ui/Badge';
import { NotificationBell } from '../../features/notifications/components/NotificationBell';
import {
  LayoutDashboard,
  Ticket,
  Users,
  Building2,
  CreditCard,
  BarChart3,
  LogOut,
  Headset,
  ChevronDown,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut().catch(() => null);
      const token = localStorage.getItem('supportflow_token');
      if (token) {
        await fetch('http://localhost:5000/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => null);
      }
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return 'danger';
      case 'BUSINESS_ADMIN':
        return 'purple';
      case 'SUPPORT_AGENT':
        return 'success';
      case 'CUSTOMER':
      default:
        return 'info';
    }
  };

  const getNavLinks = () => {
    switch (user?.role) {
      case 'PLATFORM_ADMIN':
        return [
          { name: 'Platform Admin', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'All Businesses', path: '/admin/businesses', icon: Building2 },
          { name: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
        ];
      case 'BUSINESS_ADMIN':
        return [
          { name: 'Dashboard', path: '/business/dashboard', icon: LayoutDashboard },
          { name: 'All Tickets', path: '/business/tickets', icon: Ticket },
          { name: 'Team Agents', path: '/business/team', icon: Users },
          { name: 'Billing & Plan', path: '/business/billing', icon: CreditCard },
          { name: 'Reports', path: '/business/reports', icon: BarChart3 },
        ];
      case 'SUPPORT_AGENT':
        return [
          { name: 'Agent Queue', path: '/agent/dashboard', icon: LayoutDashboard },
          { name: 'My Tickets', path: '/agent/tickets', icon: Ticket },
        ];
      case 'CUSTOMER':
      default:
        return [
          { name: 'My Tickets', path: '/customer/tickets', icon: Ticket },
          { name: 'New Support Ticket', path: '/customer/tickets/new', icon: Ticket },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 antialiased font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 shadow-sm">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
            <Headset className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900">SupportFlow</h1>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-indigo-600">
              Customer Success
            </p>
          </div>
        </div>

        {/* User Business Banner */}
        {user?.business && (
          <div className="mx-4 mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">
              Organization
            </span>
            <span className="font-bold text-slate-900 truncate block mt-0.5 text-sm">
              {user.business.name}
            </span>
            <span className="text-xs text-indigo-600 font-semibold capitalize mt-0.5 inline-block">
              {user.business.plan.toLowerCase()} Plan
            </span>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-4 space-y-1 flex-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Info */}
        <div className="p-4 border-t border-slate-100 relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.fullName}</p>
                <Badge variant={getRoleBadgeVariant(user?.role)} className="mt-0.5 text-[10px]">
                  {user?.role?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute bottom-16 left-4 right-4 bg-white border border-slate-200 rounded-xl p-2 shadow-xl space-y-1 z-30">
              <div className="px-3 py-2 border-b border-slate-100 text-xs">
                <p className="text-slate-400">Signed in as</p>
                <p className="text-slate-900 font-semibold truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200/80 px-6 flex items-center justify-between bg-white/80 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-bold text-slate-900 text-base">SupportFlow Console</span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Route Page Container */}
        <div className="p-6 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
