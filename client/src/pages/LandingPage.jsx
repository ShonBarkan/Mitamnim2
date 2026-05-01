import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import { MessageContext } from '../contexts/MessageContext';

import PersonalInfo from '../components/LandingPage/PersonalInfo';
import MainBanners from '../components/LandingPage/MainBanners';
import MessageFeed from '../components/MessageFeed';
import ActivityCreator from '../components/Activity/ActivityCreator';
import GroupLeaderboard from '../components/Stats/GroupLeaderboard';

const LandingPage = () => {
  const { user } = useAuth();
  const { refreshUsers } = useUsers();
  const { mainMessages, fetchMainMessages } = useContext(MessageContext);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  useEffect(() => {
    if (user?.group_id) refreshUsers(user.group_id);
    fetchMainMessages();
  }, [user, refreshUsers, fetchMainMessages]);

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 pb-20 px-4 md:px-8 font-sans" dir="rtl">
      
      {/* --- PREMIUM HEADER --- */}
      <header className="max-w-[1600px] mx-auto pt-12 pb-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-zinc-900">
            שלום, {user?.first_name || user?.username} 👋
          </h1>
        </div>

        {/* Action Zone: Banners & Button matching width */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-3">
            <MainBanners mainMessages={mainMessages} />
          </div>
          <div className="h-full">
             <button 
              onClick={() => setIsAddLogOpen(true)}
              className="w-full h-full min-h-[80px] bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[2rem] font-black shadow-2xl shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4 text-2xl"
            >
              <span className="text-4xl leading-none">+</span>
              תיעוד אימון מהיר
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto space-y-10">
        
        {/* --- PERSONAL INFO AREA --- */}
        <section className="w-full">
          <PersonalInfo user={user} />
        </section>

        {/* --- MAIN GRID: LEADERBOARD & SIDEBAR --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          
          {/* Main Content: Leaderboard - 3/4 */}
          <div className="lg:col-span-3 space-y-6">
            <GroupLeaderboard />
          </div>

          {/* Sidebar: Schedule & Feed - 1/4 */}
          <aside className="lg:col-span-1 space-y-8">
            
            {/* Future Schedule Component */}
            <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-[2.5rem] p-8 shadow-xl border-dashed border-zinc-300 min-h-[200px] flex flex-col justify-center items-center text-center">
               <p className="text-blue-600 font-black text-sm uppercase tracking-widest mb-2">My Schedule</p>
               <p className="text-zinc-400 font-bold text-lg">לוח זמנים אישי (בקרוב)</p>
            </div>

            {/* Message Feed */}
            <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl overflow-hidden sticky top-8">
              <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight">לוח מודעות</h2>
                <span className="bg-zinc-200 text-zinc-600 text-[10px] px-2 py-1 rounded-md font-black uppercase">Live</span>
              </div>
              <div className="p-4 max-h-[600px] overflow-y-auto scrollbar-hide">
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

      {/* --- QUICK LOG MODAL / BOTTOM SHEET --- */}
      {isAddLogOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md" onClick={() => setIsAddLogOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] animate-in slide-in-from-bottom duration-500">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8 px-2">
                <h3 className="text-3xl font-black tracking-tighter">תיעוד אימון</h3>
                <button onClick={() => setIsAddLogOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors text-2xl p-2 bg-zinc-100 rounded-full w-12 h-12 flex items-center justify-center">✕</button>
              </div>
              <ActivityCreator onComplete={() => setIsAddLogOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;