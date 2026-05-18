import React from 'react';

/**
 * AnalyticsHeader Component - Structural context filtration triggers and title banners.
 */
const AnalyticsHeader = ({ 
  isTrainer, 
  selectedTraineeId, 
  activeTraineeProfile, 
  dateRange, 
  setDateRange, 
  trainerViewMode, 
  setTrainerViewMode 
}) => {
  return (
    <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-white/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/60 shadow-xl" dir="rtl">
      <div className="space-y-2 flex-1">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-zinc-900 m-0 leading-tight uppercase">
          {isTrainer && !selectedTraineeId 
            ? (trainerViewMode === 'exercise' ? 'ניתוח השוואתי לפי תרגילים' : 'ניתוח ביצועי קבוצה') 
            : activeTraineeProfile 
              ? `סטטיסטיקה: ${activeTraineeProfile.first_name} ${activeTraineeProfile.second_name}` 
              : 'מדדי הביצועים שלי'
          }
        </h1>
        <p className="text-xs font-bold text-zinc-400 m-0 max-w-2xl leading-relaxed">
          {isTrainer && !selectedTraineeId 
            ? (trainerViewMode === 'exercise' ? 'מבט רוחבי המשווה את רמת הביצועים המקסימלית של כלל חברי המועדון בכל תרגיל' : 'סיכום נפח נתונים, מגמות ריצה ושיאים ברמת המועדון') 
            : 'ניתוח התקדמות, מדדי עומסים אקטיביים ושיאים אישיים בהתאם לטווח שנבחר'
          }
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto shrink-0 items-stretch sm:items-center">
        {/* Tactical Strategy Toggle Row: Visible ONLY for Global Group Overview Contexts */}
        {isTrainer && !selectedTraineeId && (
          <div className="flex bg-white/60 border border-white p-1 rounded-2xl shadow-inner shrink-0 font-sans">
            <button
              type="button"
              onClick={() => setTrainerViewMode('trainee')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                trainerViewMode === 'trainee' 
                  ? 'bg-zinc-900 text-white shadow-md' 
                  : 'text-zinc-400 hover:text-zinc-900'
              }`}
            >
              👥 לפי מתאמנים
            </button>
            <button
              type="button"
              onClick={() => setTrainerViewMode('exercise')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                trainerViewMode === 'exercise' 
                  ? 'bg-zinc-900 text-white shadow-md' 
                  : 'text-zinc-400 hover:text-zinc-900'
              }`}
            >
              🏋️‍♂️ לפי תרגילים
            </button>
          </div>
        )}

        {/* Time Filtering Capsule Control Fields */}
        <div className="flex bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-white/80 shadow-inner shrink-0 justify-between sm:justify-start">
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
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap active:scale-95 ${
                dateRange === filter.id 
                  ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/10' 
                  : 'text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default AnalyticsHeader;