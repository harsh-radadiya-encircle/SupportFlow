import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Lazy-loaded route page components for optimal bundle splitting & live performance
const LandingPage = lazy(() => import('../../features/landing').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('../../features/auth').then((m) => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('../../features/auth').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('../../features/auth').then((m) => ({ default: m.ResetPasswordPage })));
const AcceptInvitePage = lazy(() => import('../../features/invitations').then((m) => ({ default: m.AcceptInvitePage })));
const PlatformAdminDashboardPage = lazy(() => import('../../features/dashboard').then((m) => ({ default: m.PlatformAdminDashboardPage })));
const BusinessAdminDashboardPage = lazy(() => import('../../features/dashboard').then((m) => ({ default: m.BusinessAdminDashboardPage })));
const AgentDashboardPage = lazy(() => import('../../features/dashboard').then((m) => ({ default: m.AgentDashboardPage })));
const ReportsPage = lazy(() => import('../../features/dashboard').then((m) => ({ default: m.ReportsPage })));
const RatingsPage = lazy(() => import('../../features/dashboard').then((m) => ({ default: m.RatingsPage })));
const CustomerTicketListPage = lazy(() => import('../../features/tickets').then((m) => ({ default: m.CustomerTicketListPage })));
const CreateTicketPage = lazy(() => import('../../features/tickets').then((m) => ({ default: m.CreateTicketPage })));
const TicketDetailPage = lazy(() => import('../../features/tickets').then((m) => ({ default: m.TicketDetailPage })));
const AgentManagementPage = lazy(() => import('../../features/invitations').then((m) => ({ default: m.AgentManagementPage })));
const BillingManagementPage = lazy(() => import('../../features/subscriptions/pages/BillingManagementPage').then((m) => ({ default: m.BillingManagementPage })));
const AdminSubscriptionsPage = lazy(() => import('../../features/subscriptions/pages/AdminSubscriptionsPage').then((m) => ({ default: m.AdminSubscriptionsPage })));
const AllBusinessesPage = lazy(() => import('../../features/businesses/pages/AllBusinessesPage').then((m) => ({ default: m.AllBusinessesPage })));
const AllUsersPage = lazy(() => import('../../features/users/pages/AllUsersPage').then((m) => ({ default: m.AllUsersPage })));
const ProfilePage = lazy(() => import('../../features/profile').then((m) => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import('../../features/notifications').then((m) => ({ default: m.NotificationsPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 space-y-3 font-sans">
    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    <p className="text-xs font-semibold text-slate-500">Loading module...</p>
  </div>
);

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  const getRoleDashboardPath = () => {
    switch (user?.role) {
      case 'PLATFORM_ADMIN':
        return '/admin/dashboard';
      case 'BUSINESS_ADMIN':
        return '/business/dashboard';
      case 'SUPPORT_AGENT':
        return '/agent/dashboard';
      case 'CUSTOMER':
      default:
        return '/customer/tickets';
    }
  };

  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Auth Routes (Redirect to Dashboard if already logged in) */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to={getRoleDashboardPath()} replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to={getRoleDashboardPath()} replace /> : <LoginPage />}
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />

        {/* Authenticated Console Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Platform Admin */}
            <Route element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN']} />}>
              <Route path="/admin/dashboard" element={<PlatformAdminDashboardPage />} />
              <Route path="/admin/businesses" element={<AllBusinessesPage />} />
              <Route path="/admin/users" element={<AllUsersPage />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
            </Route>

            {/* Business Admin */}
            <Route element={<ProtectedRoute allowedRoles={['BUSINESS_ADMIN']} />}>
              <Route path="/business/dashboard" element={<BusinessAdminDashboardPage />} />
              <Route path="/business/tickets" element={<CustomerTicketListPage />} />
              <Route path="/business/team" element={<AgentManagementPage />} />
              <Route path="/business/billing" element={<BillingManagementPage />} />
              <Route path="/business/reports" element={<ReportsPage />} />
              <Route path="/business/ratings" element={<RatingsPage />} />
            </Route>

            {/* Support Agent */}
            <Route element={<ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'BUSINESS_ADMIN']} />}>
              <Route path="/agent/dashboard" element={<AgentDashboardPage />} />
              <Route path="/agent/tickets" element={<CustomerTicketListPage />} />
              <Route path="/agent/ratings" element={<RatingsPage />} />
            </Route>

            {/* Customer & Shared Ticket Routes */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/customer/tickets" element={<CustomerTicketListPage />} />
            <Route path="/customer/tickets/new" element={<CreateTicketPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Route>
        </Route>

        {/* Default Catch-all Redirect to Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
