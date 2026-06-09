import React from 'react';

const StickyFooter = ({
  isTimerOpen,
  setIsTimerOpen,
  handleCancelWorkout,
  toggleAllStatus,
  hasLogs,
  setIsExerciseModalOpen,
  handleFinishWorkout,
  completedCount
}) => {
  return (
    <div className="fixed bottom-0 w-full p-4 bg-white/90 backdrop-blur-xl border-t border-zinc-200/60 z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
      <div className={`mx-auto w-full transition-all duration-300 ${isTimerOpen ? 'max-w-7xl' : 'max-w-4xl'}`}>
        
        {/* Top Actions Row: Cancel, Timer Toggle, & Toggle All */}
        <div className="flex justify-between items-center px-2 mb-3">
          <button 
            onClick={handleCancelWorkout}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors bg-rose-50/50 hover:bg-rose-100 px-3 py-1.5 rounded-lg"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            <span className="hidden sm:inline">ביטול אימון</span>
          </button>
          
          <div className="flex items-center gap-2">
            {/* Timer Toggle Button */}
            <button 
              onClick={() => setIsTimerOpen(!isTimerOpen)}
              className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg border ${
                isTimerOpen 
                  ? 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100' 
                  : 'text-zinc-600 bg-white border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              {isTimerOpen ? 'סגור טיימר' : 'פתח טיימר'}
            </button>

            {hasLogs && (
              <button 
                onClick={toggleAllStatus}
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors bg-white border border-zinc-200 hover:bg-zinc-50 px-3 py-1.5 rounded-lg"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                <span className="hidden sm:inline">סמן / בטל הכל</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Actions Row: Add & Finish */}
        <div className="flex gap-3">
          <button 
            onClick={() => setIsExerciseModalOpen(true)}
            className="flex-1 py-4 md:py-5 bg-zinc-100 text-zinc-900 font-black text-sm md:text-base rounded-2xl shadow-sm hover:bg-zinc-200 transition-all active:scale-95 border border-zinc-200 flex items-center justify-center gap-2"
          >
            הוסף תרגיל <span>+</span>
          </button>
          
          <button 
            onClick={handleFinishWorkout}
            className="flex-[2] py-4 md:py-5 bg-zinc-900 text-white font-black text-sm md:text-base rounded-2xl shadow-xl hover:bg-zinc-800 transition-all active:scale-95 flex justify-between px-6 md:px-8"
          >
            <span>סיום ושמירה</span>
            <span className="text-zinc-400">({completedCount} סטים בוצעו)</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default StickyFooter;