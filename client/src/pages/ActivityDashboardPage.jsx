import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { WorkoutContext } from '../contexts/WorkoutContext';
import { UserContext } from '../contexts/UserContext';
import { ExerciseContext } from '../contexts/ExerciseContext';

// Sub-components re-mapped strictly to the customized localized components directory path
import ActivityJournal from '../components/ActivityDashboardPage/ActivityJournal';
import ActivityCreator from '../components/ActivityDashboardPage/ActivityCreator';
import FrontendLogger from '../utils/logger';

/**
 * ActivityDashboardPage - The central performance capturing hub and training log ecosystem.
 * Features a dynamic Trainer Sidebar for tactical squad management and high-end glassmorphic feed states.
 * Fully synchronized with the global relational WorkoutContext tracking pipelines.
 */
const ActivityDashboardPage = () => {
  const { user: currentUser } = useContext(AuthContext);
  const { logs = [], loading: logsLoading, fetchLogs } = useContext(WorkoutContext);
  const { users = [], refreshUsers } = useContext(UserContext);
  const { exercises = [] } = useContext(ExerciseContext);

  // States for live operational filtering and viewport layouts
  const [selectedTraineeId, setSelectedTraineeId] = useState(null);
  const [exerciseFilter, setExerciseFilter] = useState('');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const isTrainer = currentUser?.role === 'trainer' || currentUser?.role === 'admin';

  // Synchronize state registries caches on component mount lifecycle
  useEffect(() => {
    FrontendLogger.info('ACTIVITY_DASHBOARD', 'Mounting performance analytics and activity feed dashboard');
    
    if (isTrainer && currentUser?.group_id) {
      FrontendLogger.info('ACTIVITY_DASHBOARD', `User has leadership authorization tokens. Hydrating group trainees roster for index ID: ${currentUser.group_id}`);
      refreshUsers(currentUser.group_id);
    }
    
    // Request log timeline cascade records sync from server layers via WorkoutContext
    if (fetchLogs) {
      fetchLogs(null, isTrainer);
    }
  }, [isTrainer, currentUser, fetchLogs, refreshUsers]);

  /**
   * Filtered Log Engine:
   * Dynamically evaluates active target user vectors and string search patterns.
   */
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesTrainee = !selectedTraineeId || log.user_id === selectedTraineeId;
      const matchesExercise = !exerciseFilter || 
        (log.exercise_name || '').toLowerCase().includes(exerciseFilter.toLowerCase());
      return matchesTrainee && matchesExercise;
    });
  }, [logs, selectedTraineeId, exerciseFilter]);

  /**
   * Helper: Resolves highlighted trainee state coordinates for contextual title banners
   */
  const activeTrainee = useMemo(() => {
    return users.find(u => u.id === selectedTraineeId);
  }, [users, selectedTraineeId]);

  const handleTraineeSelect = (id) => {
    FrontendLogger.info('ACTIVITY_DASHBOARD', `Altering active tracking pipeline focus parameters to filter user ID: ${id || 'GLOBAL_FEED'}`);
    setSelectedTraineeId(id);
  };

  const handleFilterChange = (val) => {
    setExerciseFilter(val);
  };

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-zinc-200 font-sans selection:bg-zinc-900 selection:text-white" dir="rtl">
      
      {/* --- TRAINER MANAGEMENT SIDEBAR FRAME --- */}
      {isTrainer && (
        <aside className="sticky top-0 h-screen w-80 bg-white/60 backdrop-blur-3xl border-l border-white/60 shadow-2xl flex flex-col z-40">
          <div className="p-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-8 mr-2 select-none">
              My Trainees
            </h2>
            
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-hide pr-1">
              {/* Global Feed "Show All" Reset Node */}
              <button
                type="button"
                onClick={() => handleTraineeSelect(null)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 active:scale-[0.98] ${
                  !selectedTraineeId 
                    ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20' 
                    : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-900'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-lg select-none">👥</div>
                <span className="font-black text-sm uppercase tracking-tighter">כל המתאמנים</span>
              </button>

              {/* Trainee Node Map Pipeline */}
              {users.filter(u => u.role === 'trainee').map(trainee => (
                <button
                  key={trainee.id}
                  type="button"
                  onClick={() => handleTraineeSelect(trainee.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 active:scale-[0.98] group ${
                    selectedTraineeId === trainee.id 
                      ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200' 
                      : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-900'
                  }`}
                >
                  <div className="relative shrink-0">
                    {trainee.profile_picture ? (
                      <img 
                        src={trainee.profile_picture} 
                        className={`w-10 h-10 rounded-xl object-cover border-2 transition-all ${
                          selectedTraineeId === trainee.id ? 'border-blue-400' : 'border-white'
                        }`} 
                        alt="" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-[11px] font-black text-zinc-400 uppercase font-mono shadow-sm">
                        {trainee.first_name?.[0] || '?'}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black tracking-tight leading-none text-zinc-900">
                      {trainee.first_name} {trainee.second_name}
                    </p>
                    <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mt-1.5 font-mono">
                      @{trainee.username}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-auto p-8 border-t border-white/40">
             <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.3em] italic select-none leading-none">
               Mitamnim Management Suite v2
             </p>
          </div>
        </aside>
      )}

      {/* --- MAIN DASHBOARD CONTENT AREA VIEWPORT --- */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Dashboard Glass Header Layout Banner */}
          <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-8 bg-white/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/60 shadow-xl animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="space-y-2">
              <h1 className="text-5xl font-black tracking-tighter text-zinc-900 leading-tight m-0">
                {selectedTraineeId ? `ביצועים: ${activeTrainee?.first_name || 'אתלט'}` : 'יומן פעילות קבוצתי'}
              </h1>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] font-mono m-0">
                  {filteredLogs.length} Total Records Synced
                </p>
              </div>
            </div>

            {/* Header Content Search Configurations and Insertion Triggers */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative group flex-1 md:w-64">
                <input 
                  type="text"
                  placeholder="חפש תרגיל ביומן..."
                  value={exerciseFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all shadow-inner placeholder:text-zinc-300"
                />
                <span className="absolute left-6 top-1/2 -translate-y-1/2 opacity-30 select-none pointer-events-none">🔍</span>
              </div>
              
              <button 
                type="button"
                onClick={() => {
                  FrontendLogger.info('ACTIVITY_DASHBOARD', 'Opening dynamic standalone log creator portal overlay frame');
                  setIsCreatorOpen(true);
                }}
                className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center text-xl shadow-2xl shadow-zinc-900/20 hover:scale-105 active:scale-95 transition-all shrink-0 font-black border border-zinc-900"
                title="Add Manual Performance Entry"
              >
                ＋
              </button>
            </div>
          </header>

          {/* Activity Stream Feed Section Layout View */}
          <section className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <ActivityJournal 
              logs={filteredLogs} 
              loading={logsLoading} 
              isTrainerView={isTrainer} 
            />
          </section>
        </div>
      </main>

      {/* --- LOG INSERTION CREATOR DIALOG OVERLAY --- */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-400">
          <div className="absolute inset-0" onClick={() => setIsCreatorOpen(false)} />
          <div className="relative w-full max-w-2xl animate-in zoom-in-95 duration-400">
            <ActivityCreator 
              onComplete={() => {
                FrontendLogger.info('ACTIVITY_DASHBOARD', 'Performance entry created successfully. Refreshing live logs cache pool.');
                setIsCreatorOpen(false);
                if (fetchLogs) {
                  fetchLogs(null, isTrainer);
                }
              }} 
            />
            <button 
              type="button"
              onClick={() => setIsCreatorOpen(false)}
              className="absolute -top-12 left-0 text-white font-black text-xs uppercase tracking-widest hover:opacity-70 transition-opacity active:scale-95"
            >
              סגור חלון Portal ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ActivityDashboardPage;