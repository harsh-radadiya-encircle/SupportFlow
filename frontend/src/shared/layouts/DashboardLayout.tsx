import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { auth } from '../config/firebase';
import { Badge } from '../components/ui/Badge';
import { NotificationBell } from '../../features/notifications/components/NotificationBell';
import { useSetupNotificationSocket } from '../../features/notifications/hooks/useNotifications.tsx';
import { useSubscriptionDetails } from '../../features/subscriptions/hooks/useSubscriptions';
import { SubscriptionModalManager } from '../../features/subscriptions/components/SubscriptionModalManager';
import {
  LayoutDashboard,
  Ticket,
  Users,
  Building2,
  CreditCard,
  BarChart3,
  LogOut,
  Headset,
  User as UserIcon,
  Key,
  Menu,
  X,
  Star,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const { data: subData } = useSubscriptionDetails();
  useSetupNotificationSocket();
  const activePlan = subData?.plan || user?.business?.plan || 'FREE';

  const navigate = useNavigate();
  const location = useLocation();
  const [isHeaderProfileOpen, setIsHeaderProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsHeaderProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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

  const getInitials = (name?: string) => {
    if (!name) return 'HR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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

  const formatRoleLabel = (role?: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return 'Platform Admin';
      case 'BUSINESS_ADMIN':
        return 'Business Admin';
      case 'SUPPORT_AGENT':
        return 'Support Agent';
      case 'CUSTOMER':
      default:
        return 'Customer';
    }
  };

  const getNavLinks = () => {
    switch (user?.role) {
      case 'PLATFORM_ADMIN':
        return [
          { name: 'Platform Admin', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'All Businesses', path: '/admin/businesses', icon: Building2 },
          { name: 'All Users', path: '/admin/users', icon: Users },
          { name: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
        ];
      case 'BUSINESS_ADMIN':
        return [
          { name: 'Dashboard', path: '/business/dashboard', icon: LayoutDashboard },
          { name: 'All Tickets', path: '/business/tickets', icon: Ticket },
          { name: 'Team Agents', path: '/business/team', icon: Users },
          { name: 'Customer Ratings', path: '/business/ratings', icon: Star },
          { name: 'Billing & Plan', path: '/business/billing', icon: CreditCard },
          { name: 'Reports', path: '/business/reports', icon: BarChart3 },
        ];
      case 'SUPPORT_AGENT':
        return [
          { name: 'Agent Queue', path: '/agent/dashboard', icon: LayoutDashboard },
          { name: 'My Tickets', path: '/agent/tickets', icon: Ticket },
          { name: 'Customer Ratings', path: '/agent/ratings', icon: Star },
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
      {/* DESKTOP SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-200/80 flex-col shrink-0 shadow-sm min-h-screen">
        {/* Brand Header */}
        <Link to="/" className="p-5 border-b border-slate-100 flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Headset className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900 leading-none">
              SupportFlow
            </h1>
            <p className="text-xs uppercase font-semibold tracking-wider text-indigo-600 mt-1">
              Customer Success
            </p>
          </div>
        </Link>

        {/* User Business Banner */}
        {user?.business && (
          <div className="mx-4 mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="text-slate-400 block text-xs uppercase font-semibold tracking-wider">
              Organization
            </span>
            <span className="font-bold text-slate-900 truncate block mt-0.5 text-sm">
              {user.business.name}
            </span>
            <span className="text-xs text-indigo-600 font-bold capitalize mt-0.5 inline-block">
              {activePlan.toLowerCase()} Plan
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
      </aside>

      {/* MOBILE SIDEBAR DRAWER OVERLAY WITH SILKY SMOOTH SLIDE ANIMATION */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Smooth Backdrop Blur Overlay */}
        <div
          className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Smooth Horizontal Slide Drawer */}
        <div
          className={`relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Headset className="w-5 h-5" />
              </div>
              <span className="font-bold text-base text-slate-900">SupportFlow</span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Business Banner */}
          {user?.business && (
            <div className="m-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 block text-xs uppercase font-semibold">
                Organization
              </span>
              <span className="font-bold text-slate-900 block mt-0.5 truncate">
                {user.business.name}
              </span>
            </div>
          )}

          {/* Mobile Nav Links */}
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 w-full overflow-y-auto overflow-x-hidden">
        {/* Top Navbar Header */}
        <header className="h-16 border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between bg-white/90 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="font-bold text-slate-900 text-sm sm:text-base truncate select-none">
              SupportFlow Console
            </span>
          </div>

          {/* Right Top Action Bar Matching User's Design Mockup */}
          <div className="flex items-center gap-3 shrink-0" ref={profileDropdownRef}>
            <div className="flex items-center gap-1 sm:gap-1.5 p-0.5 sm:p-1 rounded-full bg-slate-50 border border-slate-200/80 shadow-2xs">
              {/* Notification Bell */}
              <NotificationBell />

              <div className="h-5 w-[1px] bg-slate-200" />

              {/* User Avatar Circle Trigger */}
              <div className="relative">
                <button
                  onClick={() => setIsHeaderProfileOpen((prev) => !prev)}
                  className="w-9 h-9 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs flex items-center justify-center transition-colors shadow-sm ring-2 ring-rose-100"
                >
                  {getInitials(user?.fullName)}
                </button>

                {/* User Profile Dropdown Card */}
                {isHeaderProfileOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
                    {/* Centered Large Avatar Header */}
                    <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
                      <div className="w-16 h-16 rounded-full bg-rose-500 text-white font-extrabold text-xl flex items-center justify-center shadow-md ring-4 ring-rose-50 mb-2">
                        {getInitials(user?.fullName)}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {user?.fullName || 'User'}
                      </h3>
                      <p className="text-xs text-slate-500 font-normal mt-0.5 truncate max-w-[240px]">
                        {user?.email}
                      </p>
                      {user?.role && (
                        <Badge
                          variant={getRoleBadgeVariant(user.role)}
                          className="mt-2 text-xs font-bold"
                        >
                          {formatRoleLabel(user.role)}
                        </Badge>
                      )}
                    </div>

                    {/* Menu Items matching reference image */}
                    <div className="py-3 space-y-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsHeaderProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-500" />
                        <span>My profile</span>
                      </Link>

                      <Link
                        to="/forgot-password"
                        onClick={() => setIsHeaderProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Key className="w-4 h-4 text-slate-500" />
                        <span>Change Password</span>
                      </Link>
                    </div>

                    {/* Footer Log out option */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-slate-500" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Route Page Container */}
        <div className="p-4 md:p-6 flex-1 w-full max-w-7xl mx-auto">
          {user?.role === 'BUSINESS_ADMIN' && <SubscriptionModalManager />}
          <Outlet />
        </div>
      </main>
    </div>
  );
};
