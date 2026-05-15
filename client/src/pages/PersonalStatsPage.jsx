import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStats } from '../contexts/StatsContext';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import { ExerciseContext } from '../contexts/ExerciseContext';
import { ParameterContext } from '../contexts/ParameterContext';

/**
 * PersonalStatsPage Component - Centralized analytics dashboard for athletes and coaches.
 * Completely refactored to pure Tailwind CSS, flat hierarchy metrics, and Arctic Mirror styling.
 */
const PersonalStatsPage = () => {
  const { userId: urlUserId } = useParams();
  const navigate = useNavigate();
  
  const { user: currentUser } = useAuth();
  const { users, refreshUsers } = useUsers();
  const { exercises } = useContext(ExerciseContext);
  const { parameters } = useContext(ParameterContext);
  const { fetchUserOverview, fetchGroupOverview, loading } = useStats();

  // Core UI control states
  const [dateRange, setDateRange] = useState('week');
  const [selectedTraineeId, setSelectedTraineeId] = useState(urlUserId || null);
  const [statsData, setStatsData] = useState(null);

  const isTrainer = currentUser?.role === 'trainer' || currentUser?.role === 'admin';
  const viewMode = isTrainer && !selectedTraineeId ? 'group' : 'individual';

  // Synchronize trainer group data on component load
  useEffect(() => {
    if (isTrainer && currentUser?.group_id) {
      refreshUsers(currentUser.group_id);
    }
  }, [isTrainer, currentUser]);

  /**
   * Generates dynamic UTC/ISO timestamp query boundaries based on selected range state.
   */
  const dateQuery = useMemo(() => {
    const now = new Date();
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (dateRange === 'week') {
      const dayOfWeek = now.getDay();
      start.setDate(now.getDate() - dayOfWeek);
    } else if (dateRange === 'month') {
      start.setDate(1);
    } else if (dateRange === 'all') {
      start.setFullYear(now.getFullYear() - 5);
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  }, [dateRange]);

  /**
   * Data Aggregation Pipeline: Pulls stats based on view mode context and filters.
   */
  useEffect(() => {
    const loadOverviewStats = async () => {
      try {
        let dataPayload = null;
        if (viewMode === 'group') {
          dataPayload = await fetchGroupOverview(dateQuery.start, dateQuery.end);
        } else {
          const targetUid = selectedTraineeId || currentUser.id;
          dataPayload = await fetchUserOverview(targetUid, dateQuery.start, dateQuery.end);
        }
        setStatsData(dataPayload);
      } catch (err) {
        console.error("Failed to compile performance overview data mappings:", err);
      }
    };
    loadOverviewStats();
  }, [viewMode, selectedTraineeId, dateQuery, currentUser, fetchUserOverview, fetchGroupOverview]);

  /**
   * Safe Context Switcher: Keeps URL routes and sidebar components in strict sync.
   */
  const handleTraineeContextSwitch = (traineeId) => {
    setSelectedTraineeId(traineeId);
    if (traineeId) {
      navigate(`/stats-page/${traineeId}`);
    } else {
      navigate('/stats-page');
    }
  };

  /**
   * Internal Helper: Matches dynamic analytics metadata with the global Parameter configurations.
   */
  const getAggregatedExerciseStats = useMemo(() => {
    if (!statsData?.exercise_aggregations) return [];
    
    return exercises.map(ex => {
      const serverAgg = statsData.exercise_aggregations.find(a => a.exercise_id === ex.id);
      if (!serverAgg) return null;

      // Extract unified layout definitions mapping individual flat metric states
      const parametersBreakdown = ex.active_parameter_ids?.map(pId => {
        const meta = parameters.find(p => p.id === pId);
        const valuesMap = serverAgg.metrics?.find(m => m.parameter_id === pId);
        
        return {
          id: pId,
          name: meta?.name || 'פרמטר',
          unit: meta?.unit || '',
          isVirtual: meta?.is_virtual || false,
          computedValue: valuesMap?.aggregated_value || '0',
          calculationType: meta?.calculation_type || 'max'
        };
      }).filter(Boolean) || [];

      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        category: ex.category || 'כללי',
        parameters: parametersBreakdown
      };
    }).filter(Boolean);
  }, [exercises, parameters, statsData]);

  // Extract currently active target trainee object context
  const activeTraineeProfile = useMemo(() => {
    return users.find(u => u.id === selectedTraineeId);
  }, [users, selectedTraineeId]);

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-zinc-200 font-sans antialiased selection:bg-zinc-900 selection:text-white" dir="rtl">
      
      {/* --- TRAINER SIDEBAR CONTEXT NAV --- */}
      {isTrainer && (
        <aside className="sticky top-0 h-screen w-80 bg-white/40 backdrop-blur-3xl border-l border-white/60 shadow-2xl flex flex-col z-40 shrink-0">
          <div className="p-8 space-y-8 flex-1 overflow-hidden flex flex-col">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mr-1">
              Select Analytics Focus
            </h2>
            
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 pl-2 scrollbar-hide">
              {/* Group Summary Option */}
              <button
                type="button"
                onClick={() => handleTraineeContextSwitch(null)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                  viewMode === 'group'
                    ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20' 
                    : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-900'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg shadow-sm">📊</div>
                <span className="font-black text-sm uppercase tracking-tight">נתוני קבוצה גלובליים</span>
              </button>

              <div className="h-px bg-white/80 my-4" />

              {/* Individual Trainees List */}
              {users.filter(u => u.role === 'trainee').map(trainee => (
                <button
                  key={trainee.id}
                  type="button"
                  onClick={() => handleTraineeContextSwitch(trainee.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
                    selectedTraineeId === trainee.id 
                      ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/30' 
                      : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-900'
                  }`}
                >
                  <div className="shrink-0">
                    {trainee.profile_picture ? (
                      <img 
                        src={trainee.profile_picture} 
                        className={`w-11 h-11 rounded-xl object-cover border-2 transition-all ${
                          selectedTraineeId === trainee.id ? 'border-blue-400' : 'border-white'
                        }`} 
                        alt="" 
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-zinc-200 text-zinc-700 flex items-center justify-center text-xs font-black uppercase">
                        {trainee.first_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="text-right min-w-0">
                    <p className="text-sm font-black tracking-tight leading-none truncate">{trainee.full_name || `${trainee.first_name} ${trainee.second_name}`}</p>
                    <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mt-1">Trainee Node</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      )}

      {/* --- MAIN INTERACTIVE VIEW AREA --- */}
      <main className="flex-1 p-8 lg:p-16 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Dashboard Control Header Panel */}
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/60 shadow-xl">
            <div className="space-y-1.5">
              <h1 className="text-5xl font-black tracking-tighter text-zinc-900 uppercase">
                {viewMode === 'group' ? 'ניתוח ביצועי קבוצה' : activeTraineeProfile ? `סטטיסטיקה: ${activeTraineeProfile.first_name}` : 'מדדי הביצועים שלי'}
              </h1>
              <p className="text-xs font-bold text-zinc-400">
                {viewMode === 'group' ? 'סיכום נפח נתונים, מגמות ושיאים ברמת המועדון' : 'ניתוח התקדמות, מדדי עומסים ושיאים אישיים בהתאם לטווח'}
              </p>
            </div>

            {/* Time Filtering Capsule Controls */}
            <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 shadow-inner shrink-0 w-full lg:w-auto justify-between lg:justify-start">
              {[
                { id: 'today', label: 'היום' },
                { id: 'week', label: 'השבוע' },
                { id: 'month', label: 'החודש' },
                { id: 'all', label: 'הכל' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setDateRange(filter.id)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap active:scale-95 ${
                    dateRange === filter.id 
                      ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20' 
                      : 'text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </header>

          {/* Core Content Layout States Switcher */}
          {loading || !statsData ? (
            <div className="flex flex-col items-center justify-center py-40 bg-white/30 backdrop-blur-3xl border border-white/60 rounded-[3rem] shadow-xl">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-zinc-200 border-t-zinc-900 mb-4" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] animate-pulse">Compiling Analytics Architecture...</p>
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              
              {/* --- OVERVIEW CARDS: VOLUME STATUS --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  label="אימונים שבוצעו" 
                  value={statsData.total_workouts || '0'} 
                  icon="🏋️‍♂️" 
                  caption="נפח אימונים כולל בטווח שנבחר"
                />
                <StatCard 
                  label="זמן אימון מצטבר" 
                  value={`${statsData.total_duration_minutes || '0'} דק'`} 
                  icon="⏱️" 
                  caption="סך כל הדקות שהושקעו בעבודה"
                />
                <StatCard 
                  label="דירוג יחסי" 
                  value={viewMode === 'group' ? 'קבוצתי' : `Top ${statsData.relative_rank_percentile || '100'}%`} 
                  icon="🏆" 
                  caption={viewMode === 'group' ? 'סיכום נפח גלובלי' : 'מיקום אקטיבי ביחס למועדון'}
                />
              </div>

              {/* --- EXERCISE MATRIX BREAKDOWN GRID --- */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-900" />
                  <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">מטריצת מדדים לתרגיל</h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-white/80 to-transparent mr-2" />
                </div>

                {getAggregatedExerciseStats.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {getAggregatedExerciseStats.map((exStat) => (
                      <div key={exStat.exerciseId} className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-6 shadow-xl flex flex-col justify-between group hover:shadow-2xl transition-all duration-300">
                        <header className="flex justify-between items-start mb-6 border-b border-white/40 pb-4">
                          <div className="space-y-0.5">
                            <h4 className="text-xl font-black text-zinc-900 tracking-tight uppercase leading-none">{exStat.exerciseName}</h4>
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block pt-1">{exStat.category}</span>
                          </div>
                        </header>

                        {/* Exercise Embedded Internal Parameters Layout Matrix */}
                        <div className="grid grid-cols-1 gap-3">
                          {exStat.parameters.map((param) => (
                            <div key={param.id} className="flex justify-between items-center p-4 bg-white/70 border border-white/90 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-black text-zinc-600 uppercase tracking-wide">{param.name}</span>
                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">
                                  {param.isVirtual ? 'מחושב אוטומטית' : `אגרגציה: ${param.calculationType}`}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black text-zinc-900 tracking-tight">{param.computedValue}</span>
                                <span className="text-[9px] font-black text-blue-500 uppercase">{param.unit}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white/20 rounded-[2.5rem] border-2 border-dashed border-white/40">
                    <span className="text-3xl block mb-2 opacity-30">📊</span>
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest italic">אין מספיק נתוני ביצוע לטווח זמנים זה</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </main>

    </div>
  );
};

/**
 * StatCard Sub-Component - Clean premium layout module for analytical view metrics.
 */
const StatCard = ({ label, value, icon, caption }) => (
  <div className="bg-white/40 backdrop-blur-3xl border border-white/60 p-6 rounded-[2rem] shadow-xl flex items-center gap-6 relative group overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-3xl shadow-md shrink-0 transition-transform group-hover:scale-110 duration-300">
      {icon}
    </div>
    <div className="space-y-0.5 text-right min-w-0">
      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block leading-none">{label}</h4>
      <p className="text-2xl font-black text-zinc-900 tracking-tighter truncate leading-none pt-1">{value}</p>
      <span className="text-[8px] font-black text-zinc-400 tracking-tight block opacity-0 group-hover:opacity-100 transition-opacity duration-300">{caption}</span>
    </div>
  </div>
);

export default PersonalStatsPage;