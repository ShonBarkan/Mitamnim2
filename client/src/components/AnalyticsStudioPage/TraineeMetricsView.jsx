import React from 'react';

/**
 * TraineeMetricsView - Displays structured chronological profile grids and performance logs cards.
 */
const TraineeMetricsView = ({ statsData, isGroupMode }) => {
  const exercisesList = statsData?.exercises || [];

  return (
    <div className="space-y-10" dir="rtl">
      
      {/* --- MACRO VOLUME METRIC COUNTER BANNER --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label={isGroupMode ? "סך אימוני קבוצה" : "אימונים שבוצעו"} 
          value={statsData?.total_workouts ?? statsData?.total_group_workouts ?? '0'} 
          icon="🏋️‍♂️" 
          caption="נפח אימונים מצטבר בטווח הנבחר"
        />
        <StatCard 
          label="זמן עבודה כולל" 
          value={`${statsData?.total_duration_minutes || '0'} דק'`} 
          icon="⏱️" 
          caption="סך כל הדקות שהושקעו באימונים"
        />
        <StatCard 
          label="סטטוס ניתוח" 
          value={isGroupMode ? 'פנורמי' : 'אינדיבידואלי'} 
          icon="🧬" 
          caption="זיהוי דפוסי ומגמות ביצוע"
        />
      </div>

      {/* --- DRILLDOWN ROW CARDS: EXERCISE CARDS BLOCK --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-2 select-none">
          <div className="w-2 h-2 rounded-full bg-zinc-900" />
          <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">מטריצת תרגילים ומדדים</h3>
          <div className="h-px flex-1 bg-gradient-to-l from-white/80 to-transparent mr-2" />
        </div>

        {exercisesList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exercisesList.map((ex) => (
              <div key={ex.exercise_id} className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-6 shadow-xl flex flex-col justify-between hover:shadow-2xl transition-all duration-300 animate-in fade-in duration-500">
                <header className="mb-6 border-b border-white/40 pb-4">
                  <h4 className="text-xl font-black text-zinc-900 m-0 tracking-tight uppercase leading-none">{ex.exercise_name}</h4>
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block pt-1.5 font-mono">Exercise Reference Profile</span>
                </header>

                <div className="grid grid-cols-1 gap-3">
                  {(ex.metrics || []).map((param) => (
                    <div key={param.parameter_id} className="flex justify-between items-center p-4 bg-white/70 border border-white/90 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-black text-zinc-600 uppercase tracking-tight">{param.parameter_name}</span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                          Strategy: {param.strategy_applied}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="text-lg font-black text-zinc-900 tracking-tight">{param.computed_value}</span>
                        <span className="text-[9px] font-black text-blue-500 uppercase select-none">{param.unit || 'VAL'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/20 backdrop-blur-sm rounded-[2.5rem] border-2 border-dashed border-white/40 select-none pointer-events-none">
            <span className="text-3xl block mb-2 opacity-30">📊</span>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest italic m-0">אין נתוני ביצוע זמינים עבור חיתוך זה</p>
          </div>
        )}
      </div>

    </div>
  );
};

const StatCard = ({ label, value, icon, caption }) => (
  <div className="bg-white/40 backdrop-blur-3xl border border-white/60 p-6 rounded-[2rem] shadow-xl flex items-center gap-6 relative group overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none select-none" />
    <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-3xl shadow-md shrink-0 transition-transform group-hover:scale-110 duration-300 select-none">
      {icon}
    </div>
    <div className="space-y-0.5 text-right min-w-0">
      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block leading-none select-none">{label}</h4>
      <p className="text-2xl font-black text-zinc-900 tracking-tighter truncate leading-none pt-1 font-mono">{value}</p>
      <span className="text-[8px] font-black text-zinc-400 tracking-tight block opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">{caption}</span>
    </div>
  </div>
);

export default TraineeMetricsView;