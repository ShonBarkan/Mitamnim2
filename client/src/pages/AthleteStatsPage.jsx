import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { AuthContext } from '../contexts/AuthContext';
import { UserContext } from '../contexts/UserContext';
import { useStatistics } from '../contexts/StatisticsContext';
import { useParameter } from '../contexts/ParameterContext';
import { useExercise } from '../contexts/ExerciseContext';
import TrainerSidebar from '../components/common/users/TrainerSidebar';

const AthleteStatsPage = () => {
  const { user } = useContext(AuthContext);
  const { users } = useContext(UserContext);
  const { fetchAthleteStats, loadingStats } = useStatistics();
  const { parameters } = useParameter();
  const { exercises } = useExercise();
  
  const { athleteId } = useParams();
  const navigate = useNavigate();

  const [statsData, setStatsData] = useState(null);
  const [filters, setFilters] = useState({
    parameterName: '',
    exerciseId: '',
    monthsBack: 3
  });

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';
  
  const targetAthleteId = athleteId || user?.id;
  
  const targetAthlete = useMemo(() => {
    return users?.find(u => u.id === targetAthleteId) || user;
  }, [users, targetAthleteId, user]);

  // Set default parameter if none selected
  useEffect(() => {
    if (parameters.length > 0 && !filters.parameterName) {
      setFilters(prev => ({ ...prev, parameterName: parameters[0].name }));
    }
  }, [parameters, filters.parameterName]);

  // Fetch data on filter change
  useEffect(() => {
    const loadStats = async () => {
      if (!targetAthleteId || !filters.parameterName) return;
      
      try {
        const data = await fetchAthleteStats(
          targetAthleteId, 
          filters.parameterName, 
          filters.exerciseId ? parseInt(filters.exerciseId) : null, 
          filters.monthsBack
        );
        setStatsData(data);
      } catch (error) {
        console.error(error);
      }
    };

    loadStats();
  }, [targetAthleteId, filters, fetchAthleteStats]);

  // Filter relevant exercises based on the selected parameter
  const relevantExercises = useMemo(() => {
    if (!filters.parameterName) return [];
    const selectedParam = parameters.find(p => p.name === filters.parameterName);
    if (!selectedParam) return [];

    return exercises.filter(ex => {
      let ids = [];
      if (ex.parameter_ids && Array.isArray(ex.parameter_ids)) ids = ex.parameter_ids;
      else if (ex.parameters && Array.isArray(ex.parameters)) ids = ex.parameters.map(p => p.id);
      return ids.includes(selectedParam.id);
    });
  }, [exercises, filters.parameterName, parameters]);

  // --- Custom Chart Logic ---
  // Calculate the maximum value to scale the bars proportionally (adding 10% buffer for visuals)
  const chartMaxValue = useMemo(() => {
    if (!statsData || !statsData.trends || statsData.trends.length === 0) return 1;
    const max = Math.max(...statsData.trends.map(t => t.value));
    return max > 0 ? max * 1.1 : 1;
  }, [statsData]);

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-zinc-100 to-blue-100 text-zinc-900 font-sans" dir="rtl">
      
      {/* Sidebar for Trainers */}
      {isTrainer && (
        <div className="w-80 flex-shrink-0 border-l border-zinc-200/50 bg-white/40 backdrop-blur-3xl z-10 hidden lg:block">
          <TrainerSidebar 
            onUserSelect={(selectedUser) => navigate(`/statistics/athlete/${selectedUser.id}`)} 
            activeUserId={targetAthleteId}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto space-y-10">
          
          <header className="space-y-2 animate-in fade-in slide-in-from-top-10 duration-700">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600 ml-1 font-mono">
              Athlete Analytics
            </p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-zinc-900 leading-[0.85] m-0">
              הביצועים של {targetAthlete?.first_name || 'מתאמן'}
            </h1>
          </header>

          {/* Filters Bar */}
          <section className="bg-white/70 backdrop-blur-3xl rounded-[2.5rem] border border-white/70 shadow-xl shadow-zinc-200/40 p-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest px-2">מדד</label>
                <select 
                  className="w-full p-4 rounded-2xl bg-zinc-50 border border-zinc-200 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={filters.parameterName}
                  onChange={(e) => setFilters(f => ({ ...f, parameterName: e.target.value, exerciseId: '' }))}
                >
                  {parameters.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest px-2">תרגיל (אופציונלי)</label>
                <select 
                  className="w-full p-4 rounded-2xl bg-zinc-50 border border-zinc-200 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={filters.exerciseId}
                  onChange={(e) => setFilters(f => ({ ...f, exerciseId: e.target.value }))}
                >
                  <option value="">כל התרגילים במדד זה</option>
                  {relevantExercises.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest px-2">טווח זמן</label>
                <select 
                  className="w-full p-4 rounded-2xl bg-zinc-50 border border-zinc-200 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={filters.monthsBack}
                  onChange={(e) => setFilters(f => ({ ...f, monthsBack: parseInt(e.target.value) }))}
                >
                  <option value={1}>חודש אחרון</option>
                  <option value={3}>3 חודשים אחרונים</option>
                  <option value={6}>חצי שנה אחרונה</option>
                  <option value={12}>שנה אחרונה</option>
                </select>
              </div>

            </div>
          </section>

          {/* Stats & Custom Chart Area */}
          {loadingStats ? (
            <div className="h-[400px] flex items-center justify-center bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/50">
               <span className="text-zinc-400 font-bold animate-pulse">מנתח נתונים...</span>
            </div>
          ) : statsData && statsData.trends.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
              
              {/* Highlight Cards */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-center min-h-[180px]">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-bold mb-2">שיא אישי (לתקופה)</p>
                  <h3 className="text-6xl font-black">{statsData.max_value}</h3>
                </div>
                <div className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-center min-h-[180px]">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-bold mb-2">ממוצע (לתקופה)</p>
                  <h3 className="text-6xl font-black text-zinc-800">{statsData.avg_value}</h3>
                </div>
              </div>

              {/* Native Tailwind Dependency-Free Bar Chart */}
              <div className="lg:col-span-3 bg-white/70 backdrop-blur-3xl border border-white rounded-[3rem] shadow-2xl p-8 min-h-[400px] flex flex-col">
                <h3 className="text-xl font-black mb-8 text-zinc-800">מגמת התקדמות</h3>
                
                <div className="flex-1 w-full relative flex items-end justify-between gap-1 sm:gap-2 pb-6 border-b border-zinc-200 mt-10">
                  
                  {/* Background Reference Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 pb-6">
                    <div className="w-full border-t border-zinc-800"></div>
                    <div className="w-full border-t border-zinc-800"></div>
                    <div className="w-full border-t border-zinc-800"></div>
                    <div className="w-full border-t border-zinc-800"></div>
                  </div>

                  {/* Bars */}
                  {statsData.trends.map((point, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                      
                      {/* Tooltip (visible on hover) */}
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-zinc-900 text-white text-xs font-bold py-2 px-4 rounded-xl pointer-events-none transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 whitespace-nowrap z-10 shadow-xl">
                        {new Date(point.date).toLocaleDateString('he-IL')}
                        <span className="block text-center text-blue-400 mt-0.5">{point.value}</span>
                      </div>
                      
                      {/* Bar Fill */}
                      <div 
                        className="w-full max-w-[48px] bg-blue-500 rounded-t-xl transition-all duration-500 group-hover:bg-blue-600 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.1)]"
                        style={{ height: `${(point.value / chartMaxValue) * 100}%` }}
                      ></div>
                      
                      {/* X-Axis Date Label */}
                      <span className="absolute -bottom-6 text-[9px] text-zinc-400 font-bold truncate w-full text-center">
                        {new Date(point.date).toLocaleDateString('he-IL', { month: '2-digit', day: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/50 text-zinc-500 font-bold shadow-xl">
               לא נמצאו נתונים עבור מדד זה בתקופת הזמן שנבחרה.
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AthleteStatsPage;