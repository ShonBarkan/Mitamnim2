import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import { MessageContext } from '../contexts/MessageContext';

// Standardized Arctic Mirror Components
import PersonalInfo from '../components/LandingPage/PersonalInfo';
import MainBanners from '../components/LandingPage/MainBanners';
import MessageFeed from '../components/MessageFeed';
import ActivityCreator from '../components/Activity/ActivityCreator';
import GroupLeaderboard from '../components/LandingPage/GroupLeaderboard';

/**
 * LandingPage Component - The primary athlete dashboard.
 * Implements a premium "Arctic Mirror" aesthetic with deep blurs and high-contrast typography.
 */
const LandingPage = () => {
  const { user } = useAuth();
  const { refreshUsers } = useUsers();
  const { mainMessages, fetchMainMessages } = useContext(MessageContext);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  /**
   * Data Synchronization: Hydrates users and global coach messages on mount.
   */
  useEffect(() => {
    if (user?.group_id) {
      refreshUsers(user.group_id);
    }
    fetchMainMessages();
  }, [user, refreshUsers, fetchMainMessages]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-slate-50 via-zinc-100 to-blue-100 text-zinc-900 pb-24 px-6 md:px-12 font-sans selection:bg-zinc-900 selection:text-white" dir="rtl">
      
      {/* --- HERO SECTION --- */}
      <header className="max-w-[1700px] mx-auto pt-20 pb-16 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600 ml-1">Athlete Command Center</p>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-zinc-900 leading-[0.85]">
              שלום, {user?.first_name || user?.username} 👋
            </h1>
          </div>
        </div>

        {/* Global Interaction Layer: Coach Banners and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="lg:col-span-3">
            <MainBanners mainMessages={mainMessages} />
          </div>
          
          <div className="h-full flex">
            <button 
              onClick={() => setIsAddLogOpen(true)}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white p-10 rounded-[3.5rem] font-black shadow-2xl shadow-zinc-900/30 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-4 group relative overflow-hidden"
            >
              {/* Decorative shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <span className="text-6xl leading-none group-hover:rotate-180 transition-all duration-700">＋</span>
              <span className="text-xs uppercase tracking-[0.3em] font-black opacity-80">תיעוד אימון מהיר</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1700px] mx-auto space-y-16">
        
        {/* --- IDENTITY SECTION --- */}
        <section className="w-full animate-in fade-in slide-in-from-right-10 duration-1000 delay-400">
          <PersonalInfo user={user} />
        </section>

        {/* --- PERFORMANCE GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Competitive Arena: The Global Leaderboard (75% Width) */}
          <div className="lg:col-span-9 space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <GroupLeaderboard />
          </div>

          {/* Intel Sidebar: Schedule and Bulletins (25% Width) */}
          <aside className="lg:col-span-3 space-y-12 animate-in fade-in slide-in-from-left-10 duration-1000 delay-600">
            
            {/* Arctic Schedule Node (Placeholder for upcoming module) */}
            <div className="bg-white/30 backdrop-blur-2xl border border-white/60 rounded-[3rem] p-12 shadow-xl border-dashed border-zinc-200 min-h-[300px] flex flex-col justify-center items-center text-center transition-all hover:bg-white/50 group">
                <div className="w-16 h-16 bg-blue-600/5 rounded-full flex items-center justify-center mb-6 border border-blue-500/10 group-hover:scale-110 transition-transform">
                   <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                </div>
                <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Training Ops</p>
                <p className="text-zinc-900 font-black text-2xl tracking-tighter uppercase leading-none">Schedule<br/><span className="text-zinc-300">Syncing...</span></p>
            </div>

            {/* Social Intelligence: Live Bulletin Board */}
            <div className="bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[3.5rem] shadow-2xl overflow-hidden sticky top-32">
              <div className="p-10 border-b border-white/40 bg-white/20 flex justify-between items-center">
                <div className="space-y-1">
                   <h2 className="text-3xl font-black tracking-tighter uppercase">לוח מודעות</h2>
                   <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">Real-time Group Feed</p>
                </div>
                <div className="flex items-center gap-2.5">
                   <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                   <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Active</span>
                </div>
              </div>
              
              <div className="p-8 max-h-[700px] overflow-y-auto scrollbar-hide">
                <MessageFeed 
                  title="" 
                  targetId={user?.group_id} 
                  type="general" 
                  currentUserId={user?.id} 
                  userRole={user?.role} 
                />
              </div>
            </div>
          </aside>

        </div>
      </main>

      {/* --- QUICK ACTION OVERLAY (ACTIVITY CREATOR) --- */}
      {isAddLogOpen && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-8 animate-in fade-in duration-500">
          {/* Heavy visual distortion backdrop */}
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[40px] transition-opacity" onClick={() => setIsAddLogOpen(false)} />
          
          {/* Modal Container: High-end Arctic Mirror execution */}
          <div className="relative w-full max-w-4xl bg-white/40 backdrop-blur-3xl rounded-t-[4rem] md:rounded-[4rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.4)] overflow-hidden max-h-[94vh] animate-in slide-in-from-bottom-20 duration-700 ease-out border border-white/60">
            <div className="p-12">
              <header className="flex justify-between items-center mb-12 px-6">
                <div className="space-y-2">
                  <h3 className="text-5xl font-black tracking-tighter text-zinc-900 uppercase">תיעוד אימון</h3>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Deploy New Performance Matrix Record</p>
                </div>
                <button 
                  onClick={() => setIsAddLogOpen(false)} 
                  className="text-zinc-400 hover:text-zinc-900 transition-all w-16 h-16 bg-white/60 hover:bg-white rounded-[1.5rem] flex items-center justify-center border border-white/80 active:scale-90 shadow-sm"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </header>
              
              {/* Internal scroll engine for the creator wizard */}
              <div className="max-h-[65vh] overflow-y-auto px-6 scrollbar-hide">
                <ActivityCreator onComplete={() => setIsAddLogOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;