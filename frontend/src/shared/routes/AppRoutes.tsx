import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '../../features/auth';
import { BusinessAdminDashboardPage, PlatformAdminDashboardPage, AgentDashboardPage } from '../../features/dashboard';
import { CustomerTicketListPage, CreateTicketPage, TicketDetailPage } from '../../features/tickets';
import { AgentManagementPage, AcceptInvitePage } from '../../features/invitations';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />

      {/* Authenticated Dashboard Routes */}
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
            <Route path="/business/tickets" element={<BusinessAdminDashboardPage />} />
            <Route path="/business/team" element={<AgentManagementPage />} />
            <Route path="/business/billing" element={<BusinessAdminDashboardPage />} />
            <Route path="/business/reports" element={<BusinessAdminDashboardPage />} />
          </Route>

          {/* Support Agent */}
          <Route element={<ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'BUSINESS_ADMIN']} />}>
            <Route path="/agent/dashboard" element={<AgentDashboardPage />} />
            <Route path="/agent/tickets" element={<AgentDashboardPage />} />
          </Route>

          {/* Customer & Shared Ticket Routes */}
          <Route path="/customer/tickets" element={<CustomerTicketListPage />} />
          <Route path="/customer/tickets/new" element={<CreateTicketPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
        </Route>
      </Route>

      {/* Default Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
