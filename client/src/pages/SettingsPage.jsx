import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ParameterManager from '../components/SettingsPage/ParameterManager';
import TagManager from '../components/SettingsPage/TagManager';
import DashboardConfigManager from '../components/SettingsPage/DashboardConfigManager';
import FrontendLogger from '../utils/logger';

/**
 * SettingsPage Component - System Administration and Configuration Engine.
 * Implements a premium tabbed layout managing dynamic rendering scopes between parameters, tags, and dashboard configs.
 * Fully responsive across mobile, tablet, and desktop environments.
 */
const SettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active sub-system layout boundary state manager - 'parameters' | 'tags' | 'dashboard'
  const [activeTab, setActiveTab] = useState('parameters');

  // Access control constraint matrix
  const isAuthorized = user?.role === 'trainer' || user?.role === 'admin';

  useEffect(() => {
    FrontendLogger.info('SETTINGS_PAGE', 'Mounting system configuration and logic engine dashboard view');
    if (user && !isAuthorized) {
      FrontendLogger.warn('SETTINGS_PAGE', `Unauthorized access attempt by '${user.username}'. Re-routing.`);
      navigate('/');
    }
  }, [user, isAuthorized, navigate]);

  if (!user || !isAuthorized) {
    return null; 
  }

  // Helper to determine title/subtitle based on tab
  const getTabInfo = () => {
    switch (activeTab) {
      case 'parameters': return { title: 'ניהול פרמטרי מדידה', desc: 'כאן ניתן לערוך, להקים ולשלב פרמטרי מדידה פעילים ונוסחאות.' };
      case 'tags': return { title: 'ניהול תגים קבוצתיים', desc: 'כאן ניתן לנהל קטגוריות ותגים מותאמים אישית לצורך סינון מדדים ותרגילים.' };
      case 'dashboard': return { title: 'הגדרות תצוגת דשבורד', desc: 'כאן ניתן לקבוע אילו מדדים יופיעו בדשבורד הקבוצתי ואיך הם יחושבו.' };
      default: return { title: '', desc: '' };
    }
  };

  const tabInfo = getTabInfo();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-zinc-200 p-4 sm:p-6 md:p-12 font-sans" dir="rtl">
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-10">
        
        {/* --- DYNAMIC BRIGHT GLASS HEADER --- */}
        <header className="bg-white/40 backdrop-blur-2xl rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-white/60 shadow-2xl shadow-zinc-200/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 md:gap-5">
              <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 bg-zinc-900 rounded-[1rem] md:rounded-[1.25rem] flex items-center justify-center text-white text-xl md:text-2xl shadow-xl shadow-zinc-900/10 select-none">
                ⚙️
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-zinc-900 uppercase leading-tight">ניהול מערכת והגדרות</h1>
                <p className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1">System Configuration & Logic Engine</p>
              </div>
            </div>

            {/* --- PREMIUM ARCTIC MIRROR TAB NAVIGATION CAPSULE --- */}
            {/* Switched to a grid on mobile for equal width tabs, flex on desktop */}
            <div className="bg-white/50 backdrop-blur-md border border-white/80 p-1.5 md:p-2 rounded-2xl md:rounded-3xl grid grid-cols-3 md:flex items-center gap-1 md:gap-2 shadow-inner w-full md:w-auto md:max-w-max select-none">
              <button
                type="button"
                onClick={() => { setActiveTab('parameters'); }}
                className={`px-2 py-3 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all duration-300 text-center flex items-center justify-center gap-1.5 ${
                  activeTab === 'parameters' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/40'
                }`}
              >
                <span className="hidden sm:inline">📊</span> פרמטרים
              </button>
              
              <button
                type="button"
                onClick={() => { setActiveTab('tags'); }}
                className={`px-2 py-3 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all duration-300 text-center flex items-center justify-center gap-1.5 ${
                  activeTab === 'tags' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/40'
                }`}
              >
                <span className="hidden sm:inline">🏷️</span> תגים
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('dashboard'); }}
                className={`px-2 py-3 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all duration-300 text-center flex items-center justify-center gap-1.5 ${
                  activeTab === 'dashboard' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/40'
                }`}
              >
                <span className="hidden sm:inline">📈</span> דשבורד
              </button>
            </div>
          </div>
        </header>

        {/* --- DETACHED SUB-SYSTEM WORKSPACE --- */}
        <main className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/60 backdrop-blur-3xl rounded-[2rem] md:rounded-[3.5rem] border border-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] overflow-hidden">
            
            <div className="p-5 md:p-8 border-b border-zinc-100/50 bg-white/30 select-none">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-zinc-900">{tabInfo.title}</h2>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1 leading-relaxed">
                {tabInfo.desc}
              </p>
            </div>

            <div className="p-4 sm:p-6 md:p-8">
              {activeTab === 'parameters' && <ParameterManager />}
              {activeTab === 'tags' && <TagManager />}
              {activeTab === 'dashboard' && <DashboardConfigManager />}
            </div>

          </div>
        </main>

      </div>
    </div>
  );
};

export default SettingsPage;