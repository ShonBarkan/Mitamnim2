import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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

  // Helper to check active route for styling
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-[100] w-full bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-3 font-sans" dir="rtl">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        
        {/* Brand & Navigation Links */}
        <div className="flex items-center gap-8">
          {/* Logo / Brand Indicator */}
          <div className="flex items-center gap-2 ml-4">
            <div className="w-6 h-6 bg-zinc-900 rounded-lg flex items-center justify-center text-[10px] text-white font-black">M</div>
            <span className="text-xs font-black tracking-widest uppercase text-zinc-900 hidden md:block">מתאמנים2</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
            <NavLink to="/" active={isActive("/")}>דף הבית</NavLink>
            <NavLink to="/exercises" active={isActive("/exercises")}>תרגילים</NavLink>
            <NavLink to="/workout-templates" active={isActive("/workout-templates")}>אימונים</NavLink>
            <NavLink to="/chats" active={isActive("/chats")}>צ'אטים</NavLink>
            <NavLink to="/stats-page" active={isActive("/stats-page")}>סטטיסטיקה</NavLink>

            {/* Privileged Links Group */}
            {isTrainer && (
              <div className="flex items-center gap-1 mr-4 pr-4 border-r border-zinc-100">
                <NavLink 
                  to="/users" 
                  active={isActive("/users")} 
                  subtle 
                >
                  ניהול משתמשים
                </NavLink>
                <NavLink 
                  to="/coach-messages" 
                  active={isActive("/coach-messages")} 
                  subtle
                >
                  הודעות מאמן
                </NavLink>
                <NavLink 
                  to="/settings" 
                  active={isActive("/settings")} 
                  subtle
                >
                  הגדרות
                </NavLink>
                {isAdmin && (
                  <NavLink to="/groups" active={isActive("/groups")} subtle>ניהול קבוצות</NavLink>
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-black text-zinc-900 leading-none">{user.username}</span>
            <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter mt-0.5">{user.role}</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="group flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95"
            title="התנתק"
          >
            <span className="text-xs leading-none transition-transform group-hover:rotate-12">🚪</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

// Internal reusable link component
const NavLink = ({ to, children, active, subtle }) => (
  <Link 
    to={to} 
    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all whitespace-nowrap ${
      active 
        ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200' 
        : subtle 
          ? 'text-zinc-400 hover:text-blue-600 hover:bg-blue-50/50'
          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
    }`}
  >
    {children}
  </Link>
);

export default Navbar;