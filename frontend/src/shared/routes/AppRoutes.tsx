import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LandingPage } from '../../features/landing';
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '../../features/auth';
import { BusinessAdminDashboardPage, PlatformAdminDashboardPage, AgentDashboardPage, ReportsPage } from '../../features/dashboard';
import { CustomerTicketListPage, CreateTicketPage, TicketDetailPage } from '../../features/tickets';
import { AgentManagementPage, AcceptInvitePage } from '../../features/invitations';
import { BillingManagementPage } from '../../features/subscriptions/pages/BillingManagementPage';

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
            <Route path="/admin/businesses" element={<PlatformAdminDashboardPage />} />
            <Route path="/admin/subscriptions" element={<PlatformAdminDashboardPage />} />
          </Route>

          {/* Business Admin */}
          <Route element={<ProtectedRoute allowedRoles={['BUSINESS_ADMIN']} />}>
            <Route path="/business/dashboard" element={<BusinessAdminDashboardPage />} />
            <Route path="/business/tickets" element={<CustomerTicketListPage />} />
            <Route path="/business/team" element={<AgentManagementPage />} />
            <Route path="/business/billing" element={<BillingManagementPage />} />
            <Route path="/business/reports" element={<ReportsPage />} />
          </Route>

          {/* Support Agent */}
          <Route element={<ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'BUSINESS_ADMIN']} />}>
            <Route path="/agent/dashboard" element={<AgentDashboardPage />} />
            <Route path="/agent/tickets" element={<CustomerTicketListPage />} />
          </Route>

          {/* Customer & Shared Ticket Routes */}
          <Route path="/customer/tickets" element={<CustomerTicketListPage />} />
          <Route path="/customer/tickets/new" element={<CreateTicketPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
        </Route>
      </Route>

      {/* Default Catch-all Redirect to Landing Page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
