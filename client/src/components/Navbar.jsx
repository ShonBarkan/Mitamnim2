import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { useGroups } from '../contexts/GroupContext';
import FrontendLogger from '../utils/logger';

/**
 * Navbar Component - Global application navigation suite.
 * Aligned strictly with updated flat router paths and premium Arctic Mirror glassmorphic guidelines.
 * Includes dynamic active workout detection, responsive mobile sidebar, and dynamic group branding.
 */
const Navbar = () => {
  const { user, logout } = useAuth();
  const { loadDraft } = useSession();
  const { groups, refreshGroups } = useGroups();
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const [hasActiveDraft, setHasActiveDraft] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);

  // Hydrate groups catalog if not present in state boundaries
  useEffect(() => {
    if (groups.length === 0 && user) {
      refreshGroups();
    }
  }, [groups.length, refreshGroups, user]);

  // Map user identity to isolated group perimeter asset
  useEffect(() => {
    if (user?.group_id && groups.length > 0) {
      const groupData = groups.find(g => g.id === user.group_id);
      setActiveGroup(groupData || null);
    }
  }, [user?.group_id, groups]);

  // Check for active workout draft on mount and route changes
  useEffect(() => {
    const draft = loadDraft();
    setHasActiveDraft(!!draft);
  }, [location.pathname, loadDraft]);

  // Close mobile menu automatically on route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const handleLogout = () => {
    FrontendLogger.info('NAVBAR', `User '${user.username}' initiated global termination and disconnect lifecycle sequence`);
    // Absolute destruction of all local client-side persistency
    localStorage.clear();
    logout();
    navigate('/login');
  };

  const isAdmin = user.role === 'admin';
  const isTrainer = user.role === 'trainer' || isAdmin;

  // Evaluate stateful activation matching tokens across current router maps
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-[100] w-full bg-white/60 backdrop-blur-2xl border-b border-white/60 px-4 md:px-8 py-4 font-sans select-none" dir="rtl">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          
          {/* Dynamic Group Brand Identity / Logo */}
          <div className="flex items-center gap-3 select-none pointer-events-none">
            {activeGroup ? (
              <>
                {activeGroup.group_image ? (
                  <img 
                    src={activeGroup.group_image} 
                    alt={activeGroup.name} 
                    className="h-10 md:h-14 w-auto object-contain drop-shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-sm md:text-lg text-white font-black shadow-md">
                    {activeGroup.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm md:text-base font-black tracking-wide text-zinc-900 hidden lg:block truncate max-w-[200px]">
                  {activeGroup.name}
                </span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-zinc-200 rounded-xl animate-pulse flex items-center justify-center text-xs text-zinc-400 font-black shadow-sm">
                  M
                </div>
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400 hidden lg:block font-mono animate-pulse">
                  Loading...
                </span>
              </>
            )}
          </div>

          {/* Desktop Navigation Links (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-2">
            {hasActiveDraft && (
              <Link 
                to="/ActiveWorkoutPage" 
                className="flex items-center gap-2 px-5 py-2.5 rounded-[1.2rem] text-[11px] font-black uppercase tracking-tight transition-all duration-300 whitespace-nowrap active:scale-95 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400 hover:bg-emerald-400"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                אימון פעיל
              </Link>
            )}

            <NavLink to="/" active={isActive("/")}>דף הבית</NavLink>
            <NavLink to="/chats" active={isActive("/chats")}>צ'אטים</NavLink>
            <NavLink to="/exercises" active={isActive("/exercises")}>תרגילים</NavLink>
            <NavLink to="/templates" active={isActive("/templates")}>אימונים</NavLink>
            
            {/* New Unified Diary Link */}
            <NavLink to="/log-diary?tab=history" active={isActive("/log-diary")}>יומן תיעודים</NavLink>

            {isTrainer && (
              <div className="flex items-center gap-2 mr-4 pr-4 border-r border-zinc-300/50">
                <NavLink to="/users" active={isActive("/users")} subtle>מתאמנים</NavLink>
                <NavLink to="/coach-messages" active={isActive("/coach-messages")} subtle>הודעות</NavLink>
                <NavLink to="/settings" active={isActive("/settings")} subtle>הגדרות</NavLink>
                {isAdmin && (
                  <NavLink to="/groups" active={isActive("/groups")} subtle>קבוצות</NavLink>
                )}
              </div>
            )}
          </div>

          {/* Desktop User Terminal (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-zinc-900 leading-none tracking-tight uppercase font-mono">
                {user.username}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                 <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none font-mono">
                   {user.role} Status
                 </span>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={handleLogout}
              className="group flex items-center justify-center w-11 h-11 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 text-zinc-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-90 shadow-sm"
              title="Disconnect Session"
            >
              <span className="text-sm transition-transform duration-500 group-hover:rotate-[-12deg]">🚪</span>
            </button>
          </div>

          {/* Mobile Hamburger & Active Indicator */}
          <div className="flex md:hidden items-center gap-4">
            {hasActiveDraft && (
              <div className="flex items-center justify-center w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
            )}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-zinc-900 bg-white/80 border border-zinc-200 rounded-xl shadow-sm active:scale-95 transition-transform"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-[200] bg-zinc-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Sidebar Panel */}
      <aside 
        className={`fixed top-0 right-0 h-full w-[280px] bg-white/95 backdrop-blur-3xl z-[210] shadow-2xl transition-transform duration-300 transform md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} 
        dir="rtl"
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
             <div className="flex flex-col">
               <span className="text-xs font-black uppercase font-mono tracking-tight text-zinc-900">{user.username}</span>
               <span className="text-[9px] font-bold text-zinc-400 uppercase">{user.role}</span>
             </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 rounded-xl">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2 p-6 overflow-y-auto flex-1">
          {hasActiveDraft && (
            <Link 
              to="/ActiveWorkoutPage" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-tight transition-all active:scale-95 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400 mb-4"
            >
              <span>אימון פעיל</span>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </Link>
          )}

          <NavLink to="/" active={isActive("/")} className="w-full text-right">דף הבית</NavLink>
          <NavLink to="/chats" active={isActive("/chats")} className="w-full text-right">צ'אטים</NavLink>
          <NavLink to="/exercises" active={isActive("/exercises")} className="w-full text-right">תרגילים</NavLink>
          <NavLink to="/templates" active={isActive("/templates")} className="w-full text-right">אימונים</NavLink>
          
          {/* Mobile Link for Unified Diary */}
          <NavLink to="/log-diary?tab=history" active={isActive("/log-diary")} className="w-full text-right">יומן תיעודים</NavLink>

          {isTrainer && (
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-zinc-100">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-4 mb-1">ניהול אימונים</span>
              <NavLink to="/users" active={isActive("/users")} subtle className="w-full text-right">מתאמנים</NavLink>
              <NavLink to="/coach-messages" active={isActive("/coach-messages")} subtle className="w-full text-right">הודעות</NavLink>
              <NavLink to="/settings" active={isActive("/settings")} subtle className="w-full text-right">הגדרות</NavLink>
              
              {isAdmin && (
                <NavLink to="/groups" active={isActive("/groups")} subtle className="w-full text-right">קבוצות</NavLink>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-100">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors font-black text-xs uppercase"
          >
            <span>התנתק מהמערכת</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
};

/**
 * Reusable NavLink Sub-Component
 */
const NavLink = ({ to, children, active, subtle, onClick, className = '' }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`px-5 py-2.5 rounded-[1.2rem] text-[11px] font-black uppercase tracking-tight transition-all duration-300 active:scale-95 ${
      active 
        ? 'bg-zinc-900 text-white shadow-2xl shadow-zinc-900/20 border border-zinc-900' 
        : subtle 
          ? 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50/50 border border-transparent'
          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50/50 border border-transparent hover:border-zinc-200 shadow-sm hover:shadow-md'
    } ${className}`}
  >
    {children}
  </Link>
);

export default Navbar;