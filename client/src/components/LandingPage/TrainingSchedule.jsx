import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FrontendLogger from '../../utils/logger';

/**
 * TrainingSchedule Component - High-end decoupled squad schedule module.
 * Implements bright "Arctic Mirror" glassmorphism layers and clean operational tracking indicators.
 */
const TrainingSchedule = () => {
  const { user } = useAuth();
  const [currentDayIndex, setCurrentDayIndex] = useState(new Date().getDay());
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Hardcoded current operational matrix tailored to current team routines
  const mockWeeklySchedule = [
    { day: 'ראשון', type: 'אימון נפח', time: '18:00 - 20:00', intensity: 'high', location: 'אולם מרכזי' },
    { day: 'שני', type: 'טכניקה ותנועה', time: '17:30 - 19:30', intensity: 'medium', location: 'סטודיו א׳' },
    { day: 'שלישי', type: 'יום מנוחה / התאוששות', time: '-', intensity: 'none', location: '-' },
    { day: 'רביעי', type: 'אימון עצימות / כוח', time: '18:00 - 20:00', intensity: 'high', location: 'אולם מרכזי' },
    { day: 'חמישי', type: 'סימולציות קרב וקרדיו', time: '17:00 - 19:00', intensity: 'high', location: 'אולם מרכזי' },
    { day: 'שישי', type: 'אימון השלמות קל', time: '10:00 - 12:00', intensity: 'low', location: 'מתחם כושר' },
    { day: 'שבת', type: 'יום מנוחה', time: '-', intensity: 'none', location: '-' },
  ];

  useEffect(() => {
    FrontendLogger.info('TRAINING_SCHEDULE', 'Mounting standalone tactical calendar schedule widget view');
    setLoading(true);
    // Simulate direct state hydration sequence from local cluster memory rules
    setScheduleData(mockWeeklySchedule);
    setLoading(false);
  }, []);

  const getIntensityStyles = (intensity) => {
    switch (intensity) {
      case 'high': return 'bg-red-500/10 border border-red-500/20 text-red-600';
      case 'medium': return 'bg-amber-500/10 border border-amber-500/20 text-amber-600';
      case 'low': return 'bg-blue-500/10 border border-blue-500/20 text-blue-600';
      default: return 'bg-zinc-100 text-zinc-400 opacity-40';
    }
  };

  const daysOfWeekEnglish = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="bg-white/30 backdrop-blur-2xl border border-white/60 rounded-[3rem] p-8 shadow-xl flex flex-col transition-all hover:bg-white/40 group" dir="rtl">
      
      {/* Module Title Section */}
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-white/40">
        <div className="space-y-0.5">
          <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">לוח זמנים שבועי</h3>
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Team Training Rotations</p>
        </div>
        <div className="bg-white/80 border border-white/80 backdrop-blur-sm px-3 py-1 rounded-xl shadow-sm">
          <span className="text-blue-600 font-mono text-[10px] font-black uppercase tracking-wider">
            {daysOfWeekEnglish[currentDayIndex]}
          </span>
        </div>
      </header>

      {/* Roster Pipeline Mapping Scroll Area */}
      <div className="space-y-3 max-h-[360px] overflow-y-auto scrollbar-hide pr-1">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-zinc-400 uppercase animate-pulse">Syncing Ops Calendar...</div>
        ) : (
          scheduleData.map((session, idx) => {
            const isToday = idx === currentDayIndex;
            const isRestDay = session.intensity === 'none';

            return (
              <div 
                key={session.day} 
                className={`p-4 rounded-2xl transition-all duration-300 flex items-center justify-between gap-4 ${
                  isToday 
                    ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/10 scale-[1.02] border border-zinc-900' 
                    : 'bg-white/50 border border-white/40 hover:bg-white/80'
                }`}
              >
                {/* Right Area: Day Badge & Session Identity */}
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    isToday ? 'bg-white text-zinc-900 shadow' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {session.day}
                  </div>
                  
                  <div className="space-y-0.5 text-right">
                    <h4 className={`text-sm font-black tracking-tight leading-tight ${isToday ? 'text-white' : 'text-zinc-900'}`}>
                      {session.type}
                    </h4>
                    {!isRestDay && (
                      <p className={`text-[10px] font-bold ${isToday ? 'text-zinc-400' : 'text-zinc-400'}`}>
                        {session.location} • {session.time}
                      </p>
                    )}
                  </div>
                </div>

                {/* Left Area: Intensity Tag Checklist Status */}
                <div className="shrink-0">
                  {isRestDay ? (
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Manoah</span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                      isToday && session.intensity === 'high' ? 'bg-red-500 text-white shadow-sm shadow-red-500/20' : getIntensityStyles(session.intensity)
                    }`}>
                      {session.intensity === 'high' ? 'HIGH' : session.intensity === 'medium' ? 'MED' : 'LOW'}
                    </span>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default TrainingSchedule;