import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useActivity } from '../hooks/useActivity';
import { useUsers } from '../hooks/useUsers';
import { ExerciseContext } from '../contexts/ExerciseContext';

// Components
import ActivityJournal from '../components/Activity/ActivityJournal';
import ActivityCreator from '../components/Activity/ActivityCreator';

/**
 * ActivityDashboardPage - The central hub for performance tracking.
 * Features a Trainer Sidebar for trainee management and a high-end Glassmorphism feed.
 */
const ActivityDashboardPage = () => {
  const { user: currentUser } = useAuth();
  const { logs, loading: logsLoading, fetchLogs } = useActivity();
  const { users, refreshUsers, loading: usersLoading } = useUsers();
  const { exercises } = useContext(ExerciseContext);

  // States for filtering and UI
  const [selectedTraineeId, setSelectedTraineeId] = useState(null);
  const [exerciseFilter, setExerciseFilter] = useState('');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const isTrainer = currentUser?.role === 'trainer' || currentUser?.role === 'admin';

  // Initial data sync
  useEffect(() => {
    // If trainer, fetch all group members for the sidebar
    if (isTrainer && currentUser?.group_id) {
      refreshUsers(currentUser.group_id);
    }
    // Fetch all relevant logs (group logs for trainer, personal for trainee)
    fetchLogs(null, isTrainer);
  }, [isTrainer, currentUser]);

  /**
   * Filtered Log Engine:
   * Combines trainee selection and exercise name search.
   */
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesTrainee = !selectedTraineeId || log.user_id === selectedTraineeId;
      const matchesExercise = !exerciseFilter || 
        log.exercise_name.toLowerCase().includes(exerciseFilter.toLowerCase());
      return matchesTrainee && matchesExercise;
    });
  }, [logs, selectedTraineeId, exerciseFilter]);

  /**
   * Helper: Get current trainee object for header display
   */
  const activeTrainee = useMemo(() => {
    return users.find(u => u.id === selectedTraineeId);
  }, [users, selectedTraineeId]);

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-zinc-200 font-sans selection:bg-zinc-900 selection:text-white" dir="rtl">
      
      {/* --- TRAINER SIDEBAR --- */}
      {isTrainer && (
        <aside className="sticky top-0 h-screen w-80 bg-white/60 backdrop-blur-3xl border-l border-white/60 shadow-2xl flex flex-col z-40">
          <div className="p-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-8 mr-2">
              My Trainees
            </h2>
            
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-hide">
              {/* "Show All" Node */}
              <button
                onClick={() => setSelectedTraineeId(null)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                  !selectedTraineeId 
                    ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20' 
                    : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-900'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-lg">👥</div>
                <span className="font-black text-sm uppercase tracking-tighter">כל המתאמנים</span>
              </button>

              {/* Trainee List */}
              {users.filter(u => u.role === 'trainee').map(trainee => (
                <button
                  key={trainee.id}
                  onClick={() => setSelectedTraineeId(trainee.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
                    selectedTraineeId === trainee.id 
                      ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200' 
                      : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-900'
                  }`}
                >
                  <div className="relative">
                    {trainee.profile_picture ? (
                      <img 
                        src={trainee.profile_picture} 
                        className={`w-10 h-10 rounded-xl object-cover border-2 transition-all ${
                          selectedTraineeId === trainee.id ? 'border-blue-400' : 'border-white'
                        }`} 
                        alt="" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-400">
                        {trainee.first_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black tracking-tight leading-none">{trainee.first_name} {trainee.second_name}</p>
                    <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mt-1">@{trainee.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-auto p-8 border-t border-white/40">
             <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.3em]">
               Mitamnim Management Suite v2
             </p>
          </div>
        </aside>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-8 lg:p-16 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Dashboard Header */}
          <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-8 bg-white/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/60 shadow-xl">
            <div className="space-y-2">
              <h1 className="text-5xl font-black tracking-tighter text-zinc-900">
                {selectedTraineeId ? `ביצועים: ${activeTrainee?.first_name}` : 'יומן פעילות גלובלי'}
              </h1>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">
                  {logs.length} Total Records Synced
                </p>
              </div>
            </div>

            {/* Header Search & Actions */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative group flex-1 md:w-64">
                <input 
                  type="text"
                  placeholder="חפש תרגיל ביומן..."
                  value={exerciseFilter}
                  onChange={(e) => setExerciseFilter(e.target.value)}
                  className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all shadow-inner"
                />
                <span className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20">🔍</span>
              </div>
              
              <button 
                onClick={() => setIsCreatorOpen(true)}
                className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center text-xl shadow-2xl shadow-zinc-900/20 hover:scale-110 active:scale-95 transition-all"
                title="Add Manual Log"
              >
                ＋
              </button>
            </div>
          </header>

          {/* Activity Feed Section */}
          <section className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <ActivityJournal 
              logs={filteredLogs} 
              loading={logsLoading} 
              isTrainerView={isTrainer} 
            />
          </section>
        </div>
      </main>

      {/* --- LOG CREATOR MODAL --- */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-500">
          <div className="absolute inset-0" onClick={() => setIsCreatorOpen(false)} />
          <div className="relative w-full max-w-2xl animate-in zoom-in-95 duration-500">
            <ActivityCreator 
              onComplete={() => {
                setIsCreatorOpen(false);
                fetchLogs(null, isTrainer); // Refresh feed
              }} 
            />
            <button 
              onClick={() => setIsCreatorOpen(false)}
              className="absolute -top-12 left-0 text-white font-black text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
            >
              Close Portal ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ActivityDashboardPage;