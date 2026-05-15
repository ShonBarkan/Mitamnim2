import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Updated imports to reflect the flat registry architecture
import ParameterManager from '../components/Parameters/ParameterManager';
import ExerciseRegistryManager from '../components/Exercises/ExerciseRegistryManager';

/**
 * SettingsPage Component - System Administration and Configuration.
 * Implements the "Arctic Mirror" aesthetic with high-end Glassmorphism.
 */
const SettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Access control: Only trainers and admins can access system settings
  const isAuthorized = user?.role === 'trainer' || user?.role === 'admin';

  useEffect(() => {
    // Redirect unauthorized users to the landing page immediately
    if (user && !isAuthorized) {
      navigate('/');
    }
  }, [user, isAuthorized, navigate]);

  // Prevent flash of content for unauthorized sessions
  if (!user || !isAuthorized) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-zinc-200 p-6 md:p-12 font-sans" dir="rtl">
      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* --- PAGE HEADER --- */}
        <header className="bg-white/40 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/60 shadow-2xl shadow-zinc-200/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
              ⚙️
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase">ניהול מערכת והגדרות</h1>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.3em] mt-1">System Configuration & Logic Engine</p>
            </div>
          </div>
          <p className="text-zinc-500 font-medium text-lg max-w-2xl mt-4 leading-relaxed">
            כאן ניתן לנהל את פרמטרי המדידה הדינמיים ואת רישום התרגילים (Registry) של הקבוצה. 
            כל שינוי כאן ישפיע על תיעוד האימונים והסטטיסטיקה בזמן אמת.
          </p>
        </header>

        {/* --- MANAGEMENT GRID --- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
          
          {/* Global Parameters Section */}
          <div className="bg-white/60 backdrop-blur-3xl rounded-[3.5rem] border border-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="p-8 border-b border-zinc-100/50 bg-white/40">
              <h2 className="text-2xl font-black tracking-tight">פרמטרי מדידה</h2>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Global Unit Registry</p>
            </div>
            <div className="p-8">
              <ParameterManager />
            </div>
          </div>

          {/* Exercise Registry Section (Abolished Tree Structure) */}
          <div className="bg-white/60 backdrop-blur-3xl rounded-[3.5rem] border border-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="p-8 border-b border-zinc-100/50 bg-white/40">
              <h2 className="text-2xl font-black tracking-tight">ניהול תרגילים</h2>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Group Exercise Registry (Flat Mode)</p>
            </div>
            <div className="p-8">
              <ExerciseRegistryManager />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;