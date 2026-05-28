import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { UserContext } from '../contexts/UserContext';
import { MessageContext } from '../contexts/MessageContext';
import FrontendLogger from '../utils/logger';

// Standardized Arctic Mirror Components
import PersonalInfo from '../components/LandingPage/PersonalInfo';
import MainBanners from '../components/LandingPage/MainBanners';
import MessageFeed from '../components/MessageFeed';
import DashboardLeaderboard from '../components/LandingPage/DashboardLeaderboard';
import ExerciseLogModal from '../components/common/ExerciseLog/ExerciseLogModal';

// Icons for navigation
import { PlusCircle, BarChart2, Play, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';

const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const { refreshUsers } = useContext(UserContext);
  const { mainMessages, fetchMainMessages } = useContext(MessageContext);
  
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(true);
  
  const navigate = useNavigate();

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
      
      {/* --- HERO HEADER --- */}
      <header className="max-w-[1700px] mx-auto pt-20 pb-16 space-y-10">
        
        {/* User Greeting & Large Avatar */}
        <div className="flex items-center gap-8 animate-in fade-in slide-in-from-top-10 duration-1000 select-none">
           {user?.profile_picture ? (
             <img src={user.profile_picture} alt={user.first_name} className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl object-cover" />
           ) : (
             <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-zinc-900 text-white flex items-center justify-center text-5xl font-black shadow-2xl">
               {user?.first_name?.[0]}
             </div>
           )}
           <div className="space-y-1">
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600 ml-1 font-mono">Athlete Command Center</p>
             <h1 className="text-4xl md:text-8xl font-black tracking-tighter text-zinc-900 leading-none">
               שלום, {user?.first_name || user?.username} 👋
             </h1>
           </div>
        </div>

        {/* Global Navigation Row */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                  onClick={() => setIsLogModalOpen(true)}
                  className="bg-white/60 hover:bg-white border border-white/50 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-2 font-black text-sm text-zinc-900 transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <PlusCircle size={20}/>
                  תעד תרגיל
                </button>
              {[
                { label: 'סטטיסטיקה', icon: <BarChart2 size={20}/>, path: '/statistics' },
                { label: 'אימון חדש', icon: <Play size={20}/>, path: '/templates' },
                { label: 'צ\'אטים', icon: <MessageSquare size={20}/>, path: '/messages' }
              ].map((btn, idx) => (
                <button 
                  key={idx}
                  onClick={() => navigate(btn.path)}
                  className="bg-white/60 hover:bg-white border border-white/50 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-2 font-black text-sm text-zinc-900 transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
           </div>
        </div>
      </header>

      {/* --- DASHBOARD CORE WORKSPACE --- */}
      <main className="max-w-[1700px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Competitive Arena */}
          <div className="lg:col-span-9 space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            {/* Header + Toggle Button */}
            <div className="flex justify-between items-center px-4">
              <div>
                <h2 className="text-3xl font-black tracking-tighter uppercase text-zinc-900 m-0">
                  לוח ביצועים קבוצתי
                </h2>

                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none font-mono mt-2">
                  Team Statistics Board
                </p>
              </div>
              <button 
                onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
                className="p-2 bg-white/50 hover:bg-white rounded-full transition-all text-zinc-600"
              >
                {isLeaderboardOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </button>
            </div>
            
            {/* Collapsible Area */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isLeaderboardOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <DashboardLeaderboard />
            </div>
          </div>

          {/* Intel Sidebar */}
          <aside className="lg:col-span-3 space-y-6 animate-in fade-in slide-in-from-left-10 duration-1000 delay-600">
            
            {/* Moved Banners here */}
            <div className="animate-in zoom-in duration-700">
              <MainBanners mainMessages={mainMessages} />
            </div>

            {/* Personal Info */}
            <PersonalInfo user={user} />

            {/* Social Intelligence Room */}
            <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3.5rem] shadow-2xl overflow-hidden sticky top-32">
                <MessageFeed 
                  title="" 
                  targetId={user?.group_id} 
                  type="general" 
                  currentUserId={user?.id} 
                  userRole={user?.role} 
                  disableAutoScrollFocus={true} 
                />
            </div>
          </aside>

        </div>
      </main>

      <ExerciseLogModal
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)}
        selectedUserId={user?.id}
        canModifyLogs={true}
      />           
    </div>
  );
};

export default LandingPage;