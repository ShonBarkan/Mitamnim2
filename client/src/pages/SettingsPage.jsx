import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ParameterManager from '../components/SettingsPage/ParameterManager';
import TagManager from '../components/SettingsPage/TagManager';
import FrontendLogger from '../utils/logger';

/**
 * SettingsPage Component - System Administration and Configuration Engine.
 * Implements a premium tabbed layout managing dynamic rendering scopes between parameters and tags sub-systems.
 * Enforces strict English-only code commentary and total Hebrew UI localization support.
 */
const SettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active sub-system layout boundary state manager - 'parameters' | 'tags'
  const [activeTab, setActiveTab] = useState('parameters');

  // Access control constraint matrix: Only trainers and admins hold token validation rights
  const isAuthorized = user?.role === 'trainer' || user?.role === 'admin';

  useEffect(() => {
    FrontendLogger.info('SETTINGS_PAGE', 'Mounting system configuration and logic engine dashboard view');
    if (user && !isAuthorized) {
      FrontendLogger.warn('SETTINGS_PAGE', `Unauthorized asset access attempt by user '${user.username}' [Role: ${user.role}]. Re-routing to index.`);
      navigate('/');
    }
  }, [user, isAuthorized, navigate]);

  // Prevent UI flashing anomalies for unauthenticated/unauthorized request pipelines
  if (!user || !isAuthorized) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-zinc-200 p-6 md:p-12 font-sans" dir="rtl">
      <div className="max-w-[1600px] mx-auto space-y-10">
        
        {/* --- DYNAMIC BRIGHT GLASS HEADER --- */}
        <header className="bg-white/40 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/60 shadow-2xl shadow-zinc-200/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-zinc-900 rounded-[1.25rem] flex items-center justify-center text-white text-2xl shadow-xl shadow-zinc-900/10 select-none">
                ⚙️
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase">ניהול מערכת והגדרות</h1>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.3em] mt-1">System Configuration & Logic Engine</p>
              </div>
            </div>

            {/* --- PREMIUM ARCTIC MIRROR TAB NAVIGATION CAPSULE --- */}
            <div className="bg-white/50 backdrop-blur-md border border-white/80 p-2 rounded-3xl flex items-center gap-2 shadow-inner max-w-max self-start md:self-auto select-none">
              <button
                type="button"
                onClick={() => {
                  FrontendLogger.info('SETTINGS_PAGE', 'Shifting systemic workspace boundary context to Parameters Manager');
                  setActiveTab('parameters');
                }}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === 'parameters' 
                    ? 'bg-zinc-900 text-white shadow-lg' 
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/40'
                }`}
              >
                📊 ניהול פרמטרים
              </button>
              
              <button
                type="button"
                onClick={() => {
                  FrontendLogger.info('SETTINGS_PAGE', 'Shifting systemic workspace boundary context to Group Tags Manager');
                  setActiveTab('tags');
                }}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === 'tags' 
                    ? 'bg-zinc-900 text-white shadow-lg' 
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/40'
                }`}
              >
                🏷️ ניהול תגים קבוצתיים
              </button>
            </div>
          </div>
        </header>

        {/* --- DETACHED SUB-SYSTEM WORKSPACE --- */}
        <main className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/60 backdrop-blur-3xl rounded-[3.5rem] border border-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] overflow-hidden">
            
            <div className="p-8 border-b border-zinc-100/50 bg-white/30 select-none">
              <h2 className="text-2xl font-black tracking-tight text-zinc-900">
                {activeTab === 'parameters' ? 'ניהול פרמטרי מדידה' : 'ניהול תגים קבוצתיים'}
              </h2>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                {activeTab === 'parameters' 
                  ? 'כאן ניתן לערוך, להקים ולשלב פרמטרי מדידה פעילים ונוסחאות.' 
                  : 'כאן ניתן לנהל קטגוריות ותגים מותאמים אישית לצורך סינון מדדים ותרגילים.'}
              </p>
            </div>

            <div className="p-8">
              {activeTab === 'parameters' ? <ParameterManager /> : <TagManager />}
            </div>

          </div>
        </main>

      </div>
    </div>
  );
};

export default SettingsPage;