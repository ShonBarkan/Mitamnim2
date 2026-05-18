import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { UserContext } from '../contexts/UserContext';
import { MessageContext } from '../contexts/MessageContext';
import FrontendLogger from '../utils/logger';

// Standardized Arctic Mirror Components from local directory
import PersonalInfo from '../components/LandingPage/PersonalInfo';
import MainBanners from '../components/LandingPage/MainBanners';
import GroupLeaderboard from '../components/LandingPage/GroupLeaderboard';
import TrainingSchedule from '../components/LandingPage/TrainingSchedule';
import MessageFeed from '../components/MessageFeed';
import ActivityCreator from '../components/ActivityDashboardPage/ActivityCreator';

/**
 * LandingPage Component - The primary athlete command dashboard.
 * Implements a premium bright "Arctic Mirror" aesthetic with deep translucent blurs.
 */
const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const { refreshUsers } = useContext(UserContext);
  const { mainMessages, fetchMainMessages } = useContext(MessageContext);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  /**
   * Data Synchronization: Hydrates users portfolio and global dashboard banners.
   */
  useEffect(() => {
    FrontendLogger.info('LANDING_PAGE', 'Initializing core athlete dashboard environment view');
    if (user?.group_id && refreshUsers) {
      refreshUsers(user.group_id);
    }
    if (fetchMainMessages) {
      fetchMainMessages();
    }
  }, [user, refreshUsers, fetchMainMessages]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-zinc-100 to-blue-100 text-zinc-900 pb-24 px-6 md:px-12 font-sans selection:bg-zinc-900 selection:text-white" dir="rtl">
      
      {/* --- HERO & BROADCAST ANNOUNCEMENT HEADER --- */}
      <header className="max-w-[1700px] mx-auto pt-20 pb-16 space-y-10">
        <div className="space-y-2 animate-in fade-in slide-in-from-top-10 duration-1000 select-none">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600 ml-1 font-mono">Athlete Command Center</p>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-zinc-900 leading-[0.85] m-0">
            שלום, {user?.first_name || user?.username} 👋
          </h1>
        </div>

        {/* Global Interaction Grid: Perfectly aligned layout heights */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-stretch animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="lg:col-span-3 flex flex-col justify-between">
            <MainBanners mainMessages={mainMessages} />
          </div>
          
          {/* Quick Action Trigger Tile */}
          <div className="w-full flex">
            <button 
              type="button"
              onClick={() => {
                FrontendLogger.info('LANDING_PAGE', 'User triggered live quick workout registration modal');
                setIsAddLogOpen(true);
              }}
              className="w-full h-full min-h-[160px] bg-zinc-900 border border-zinc-900 hover:bg-zinc-800 text-white p-8 rounded-[3.5rem] font-black shadow-2xl shadow-zinc-900/20 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="text-5xl leading-none group-hover:rotate-180 transition-all duration-700 select-none">＋</span>
              <span className="text-xs uppercase tracking-[0.3em] font-black opacity-90 select-none">תיעוד אימון מהיר</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- DASHBOARD CORE WORKSPACE --- */}
      <main className="max-w-[1700px] mx-auto space-y-16">
        
        {/* --- IDENTITY INFRASTRUCTURE LAYER --- */}
        <section className="w-full animate-in fade-in slide-in-from-right-10 duration-1000 delay-400">
          <PersonalInfo user={user} />
        </section>

        {/* --- PERFORMANCE ANALYTICS & SOCIAL INTEL GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Competitive Arena: The Global Leaderboard (75% Screen Width) */}
          <div className="lg:col-span-9 space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <GroupLeaderboard />
          </div>

          {/* Intel Sidebar: Scheduled Trackers & Bulletins (25% Screen Width) */}
          <aside className="lg:col-span-3 space-y-12 animate-in fade-in slide-in-from-left-10 duration-1000 delay-600">
            
            {/* Decoupled High-End Schedule Module Placeholder */}
            <TrainingSchedule />

            {/* Social Intelligence Room: Live Non-Intrusive Bulletin Board */}
            <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3.5rem] shadow-2xl overflow-hidden sticky top-32">
              <div className="p-10 border-b border-white bg-white/20 flex justify-between items-center select-none">
                <div className="space-y-1">
                   <h2 className="text-3xl font-black tracking-tighter uppercase m-0">לוח מודעות</h2>
                   <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none font-mono mt-1">Real-time Group Feed</p>
                </div>
                <div className="flex items-center gap-2.5">
                   <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                   <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest font-mono">Active</span>
                </div>
              </div>
              
              {/* Isolated container blocks auto-scrolling to prevent main body shifting anchor drops */}
              <div className="p-8 max-h-[600px] overflow-y-auto scrollbar-hide">
                <MessageFeed 
                  title="" 
                  targetId={user?.group_id} 
                  type="general" 
                  currentUserId={user?.id} 
                  userRole={user?.role} 
                  disableAutoScrollFocus={true} 
                />
              </div>
            </div>
          </aside>

        </div>
      </main>

      {/* --- QUICK ACTION INTERACTIVE WIZARD OVERLAY --- */}
      {isAddLogOpen && (
        <div className="fixed inset-0 z-[1200] flex items-end md:items-center justify-center p-0 md:p-8 animate-in fade-in duration-400">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md transition-opacity" onClick={() => setIsAddLogOpen(false)} />
          
          <div className="relative w-full max-w-4xl bg-white/40 backdrop-blur-3xl rounded-t-[4rem] md:rounded-[4rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.3)] overflow-hidden max-h-[94vh] animate-in slide-in-from-bottom-20 duration-500 border border-white/60">
            <div className="p-10 md:p-12">
              <header className="flex justify-between items-center mb-10 px-6 select-none">
                <div className="space-y-1">
                  <h3 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase m-0">תיעוד אימון מהיר</h3>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] font-mono mt-1">Deploy New Performance Matrix Record</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsAddLogOpen(false)} 
                  className="text-zinc-400 hover:text-zinc-900 transition-all w-14 h-14 bg-white/60 hover:bg-white rounded-[1.5rem] flex items-center justify-center border border-white/80 active:scale-90 shadow-sm"
                >
                  <span className="text-xl">✕</span>
                </button>
              </header>
              
              <div className="max-h-[62vh] overflow-y-auto px-6 scrollbar-hide">
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