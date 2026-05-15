import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Navbar Component - Global navigation suite.
 * Updated to reflect the shift from Exercise Management to Activity Dashboard.
 * Features Arctic Mirror Glassmorphism and responsive design.
 */
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user.role === 'admin';
  const isTrainer = user.role === 'trainer' || isAdmin;

  // Sync active route for stateful styling
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-[100] w-full bg-white/60 backdrop-blur-2xl border-b border-white/60 px-8 py-4 font-sans" dir="rtl">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between">
        
        {/* Brand Identity & Core Navigation */}
        <div className="flex items-center gap-10">
          {/* Arctic Mirror Logo Mark */}
          <div className="flex items-center gap-3 ml-6">
            <div className="w-8 h-8 bg-zinc-900 rounded-2xl flex items-center justify-center text-xs text-white font-black shadow-2xl shadow-zinc-900/20 transition-transform hover:scale-110">
              M
            </div>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-900 hidden lg:block">
              Mitamnim v2
            </span>
          </div>

          {/* Navigation Links Collection */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
            <NavLink to="/" active={isActive("/")}>דף הבית</NavLink>
            
            {/* UPDATED: Navigating to Activity Dashboard instead of Exercises */}
            <NavLink to="/activity" active={isActive("/activity")}>יומן פעילות</NavLink>
            
            <NavLink to="/workout-templates" active={isActive("/workout-templates")}>תוכניות אימון</NavLink>
            <NavLink to="/chats" active={isActive("/chats")}>צ'אטים</NavLink>
            <NavLink to="/stats-page" active={isActive("/stats-page")}>ניתוח נתונים</NavLink>

            {/* Specialized Privileged Tools Divider */}
            {isTrainer && (
              <div className="flex items-center gap-1.5 mr-6 pr-6 border-r border-white/80">
                <NavLink 
                  to="/users" 
                  active={isActive("/users")} 
                  subtle 
                >
                  מתאמנים
                </NavLink>
                <NavLink 
                  to="/coach-messages" 
                  active={isActive("/coach-messages")} 
                  subtle
                >
                  הודעות
                </NavLink>
                <NavLink 
                  to="/settings" 
                  active={isActive("/settings")} 
                  subtle
                >
                  הגדרות
                </NavLink>
                {isAdmin && (
                  <NavLink to="/groups" active={isActive("/groups")} subtle>קבוצות</NavLink>
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Context & System Actions */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-black text-zinc-900 leading-none tracking-tight uppercase">
              {user.username}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
               <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                 {user.role} Status
               </span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="group flex items-center justify-center w-11 h-11 rounded-2xl bg-white/60 border border-white/80 text-zinc-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-90 shadow-sm"
            title="Disconnect"
          >
            <span className="text-sm transition-transform duration-500 group-hover:rotate-[-12deg]">🚪</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

/**
 * Reusable NavLink Component for consistent glassmorphism style.
 */
const NavLink = ({ to, children, active, subtle }) => (
  <Link 
    to={to} 
    className={`px-5 py-2.5 rounded-[1.2rem] text-[11px] font-black uppercase tracking-tight transition-all duration-300 whitespace-nowrap active:scale-95 ${
      active 
        ? 'bg-zinc-900 text-white shadow-2xl shadow-zinc-900/20' 
        : subtle 
          ? 'text-zinc-400 hover:text-zinc-900 hover:bg-white/80'
          : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/80 border border-transparent hover:border-white'
    }`}
  >
    {children}
  </Link>
);

export default Navbar;