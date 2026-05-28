import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import FrontendLogger from '../utils/logger';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

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

  if (!user) {
    FrontendLogger.warn('PROTECTED_ROUTE', 'Anonymous user session intercepted. Blocking route and forcing login redirect.');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && Array.isArray(allowedRoles)) {
    if (!allowedRoles.includes(user.role)) {
      FrontendLogger.warn('PROTECTED_ROUTE', `Privilege mismatch for user '${user.username}'.`);
      return <Navigate to="/" replace />;
    }
  }

  // אם הועברו children (עטיפה רגילה), נרנדר אותם. 
  // אם לא, נשתמש ב-Outlet עבור נתיבים מקוננים.
  return children ? children : <Outlet />;
};

export default ProtectedRoute;