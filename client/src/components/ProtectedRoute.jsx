import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute Component - Guards private routes.
 * Checks for authentication and verifies role-based access permissions.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  /**
   * While the authentication status is being determined, show a 
   * themed loading state matching the Arctic Mirror design.
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] animate-pulse">
            Authenticating
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if no active session is found
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  /**
   * Role-Based Access Control (RBAC):
   * If specific roles are required and the user lacks them, 
   * redirect to the landing page.
   */
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;