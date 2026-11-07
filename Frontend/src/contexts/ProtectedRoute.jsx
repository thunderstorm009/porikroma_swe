import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, roles, role, loading } = useAuth();
  const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">Loading...</div>
      </div>
    );
  }

  if (!user && !useMock) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = Array.isArray(roles) && roles.length > 0 ? roles : (role ? [role] : []);
  if (allowedRoles && !allowedRoles.some(r => userRoles.includes(r))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
