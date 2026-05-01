import React from 'react';

const ActiveParameters = ({ activeParams, loading, isTrainer, onUnlink }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-3 py-4 animate-pulse">
        <div className="w-4 h-4 bg-zinc-200 rounded-full" />
        <div className="h-4 w-32 bg-zinc-200 rounded-lg" />
      </div>
    );
  }

  return (
    <section className="mb-10 font-sans" dir="rtl">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
          Active Metrics
        </span>
        <div className="h-px flex-1 bg-zinc-100" />
      </div>

      <div className="flex flex-wrap gap-3">
        {activeParams.length > 0 ? (
          activeParams.map((ap) => (
            <div 
              key={ap.id} 
              className="group flex items-center gap-3 bg-white border border-zinc-200 pl-2 pr-4 py-2 rounded-2xl shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-300"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-black text-zinc-900 leading-none">
                  {ap.parameter_name}
                </span>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">
                  {ap.parameter_unit}
                </span>
              </div>

              {isTrainer && (
                <button 
                  onClick={() => onUnlink(ap.id)} 
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-50 text-zinc-300 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                  title="נתק פרמטר"
                >
                  <span className="text-xs leading-none">✕</span>
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="w-full py-6 px-8 bg-zinc-50 border border-dashed border-zinc-200 rounded-[1.5rem] flex flex-col items-center justify-center">
            <p className="text-sm font-bold text-zinc-400 italic">אין פרמטרים פעילים לתרגיל זה</p>
            {isTrainer && <p className="text-[10px] font-black text-blue-400 uppercase mt-1 tracking-widest">צריך לקשר נתונים למעקב</p>}
          </div>
        )}
      </div>
    </section>
  );
};

export default ActiveParameters;