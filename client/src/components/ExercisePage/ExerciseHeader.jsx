import React from 'react';

const ExerciseHeader = ({ name, id, onAddLog }) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 pb-8 border-b border-zinc-100 font-sans" dir="rtl">
      
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-10 bg-blue-600 rounded-full" />
          <h2 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter leading-none">
            {name}
          </h2>
        </div>
        
        <div className="flex items-center gap-2 mr-5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Exercise Identity
          </span>
          <div className="px-2 py-0.5 bg-zinc-100 rounded-md border border-zinc-200">
            <code className="text-[10px] font-bold text-zinc-600">#{id}</code>
          </div>
        </div>
      </div>
      
      <button 
        onClick={onAddLog}
        className="group relative overflow-hidden bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[1.5rem] font-black shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-3 text-lg"
      >
        {/* Subtle Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        
        <span className="text-2xl leading-none">+</span>
        <span>תיעוד ביצוע חדש</span>
      </button>

    </header>
  );
};

export default ExerciseHeader;