import React, { useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { UserContext } from '../contexts/UserContext';
import { MessageContext } from '../contexts/MessageContext';
import FrontendLogger from '../utils/logger';

// Standardized Arctic Mirror Components from local directory
import PersonalInfo from '../components/LandingPage/PersonalInfo';
import MainBanners from '../components/LandingPage/MainBanners';
import TrainingSchedule from '../components/LandingPage/TrainingSchedule';
import MessageFeed from '../components/MessageFeed';

/**
 * LandingPage Component - The primary athlete command dashboard.
 * Implements a premium bright "Arctic Mirror" aesthetic with deep translucent blurs.
 * Completely static layout positions with absolute zero automatic scroll behaviors.
 */
const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const { refreshUsers } = useContext(UserContext);
  const { mainMessages, fetchMainMessages } = useContext(MessageContext);

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

        {/* Global Interaction Grid: Perfectly aligned layout heights matching core perimeters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-stretch animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="lg:col-span-3 flex flex-col justify-between min-h-[160px]">
            <MainBanners mainMessages={mainMessages} />
          </div>
          
          {/* Quick Action Trigger Tile */}
          <div className="w-full flex h-full">
            <button 
              type="button"
              disabled
              className="w-full h-full min-h-[160px] bg-zinc-900 border border-zinc-900 text-white p-8 rounded-[3.5rem] font-black shadow-2xl shadow-zinc-900/20 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0" />
              <span className="text-5xl leading-none select-none">＋</span>
              <span className="text-xs uppercase tracking-[0.3em] font-black opacity-90 select-none">תיעוד אימון מהיר (בפיתוח)</span>
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
          
          {/* Competitive Arena placeholder while leaderboard module is removed */}
          <div className="lg:col-span-9 space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <div className="bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white/70 shadow-2xl shadow-zinc-200/40 p-10 min-h-[400px] flex flex-col justify-center items-center text-center">
              <h2 className="text-3xl font-black text-zinc-900">לוח דירוג קבוצתי לא זמין</h2>
              <p className="mt-4 text-sm text-zinc-500 max-w-xl">הרכיב שנדרש להצגת דירוג קבוצה הוסר. עדיין ניתן להציג הודעות ופרטי משתמש נכונים בעמוד הבית.</p>
            </div>
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
              
              {/* Cleaned container bounds with zero operational window hook side-effects */}
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

    </div>
  );
};

export default LandingPage;