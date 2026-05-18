import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import FrontendLogger from '../utils/logger';

/**
 * ProtectedRoute Component - Guards private client-side routes.
 * Checks for authentication and verifies role-based access control (RBAC) permissions.
 * Re-mapped directly to the centralized AuthContext asset file path.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  /**
   * While the authentication validation sequence is running, show a 
   * premium loading state matching the bright Arctic Mirror design rules.
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-zinc-200 font-sans">
        <div className="flex flex-col items-center gap-4 select-none">
          <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] animate-pulse font-mono">
            Verifying Token Authorization Matrix...
          </p>
        </div>
      </div>
    );
  }

  // Intercept unauthorized requests and force route displacement to login gateway
  if (!user) {
    FrontendLogger.warn('PROTECTED_ROUTE', 'Anonymous user session intercepted. Blocking route and forcing login redirect.');
    return <Navigate to="/login" replace />;
  }

  /**
   * Role-Based Access Control (RBAC) Gatekeeper:
   * Re-routes token sessions to root index if permission scope mismatch occurs.
   */
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    FrontendLogger.warn('PROTECTED_ROUTE', `Privilege mismatch observed. User '${user.username}' [Role: ${user.role}] cannot access an endpoint expecting roles: [${allowedRoles.join(', ')}]. Deflecting to baseline landing hub.`);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;