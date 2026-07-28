import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Role } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case 'PLATFORM_ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      case 'BUSINESS_ADMIN':
        return <Navigate to="/business/dashboard" replace />;
      case 'SUPPORT_AGENT':
        return <Navigate to="/agent/dashboard" replace />;
      case 'CUSTOMER':
      default:
        return <Navigate to="/customer/tickets" replace />;
    }
  }

  return <Outlet />;
};
