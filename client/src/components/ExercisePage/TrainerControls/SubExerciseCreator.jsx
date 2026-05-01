import React from 'react';

const SubExerciseCreator = ({ newSubExName, setNewSubExName, onAddSub }) => {
  return (
    <div className="p-6 bg-white border border-zinc-100 rounded-[2rem] shadow-sm font-sans" dir="rtl">
      
      {/* Label Section */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <span className="text-emerald-600 text-sm">🌱</span>
        </div>
        <h4 className="text-sm font-black text-zinc-800 uppercase tracking-widest">הוספת תת-תרגיל</h4>
      </div>

      {/* Form Area */}
      <form onSubmit={onAddSub} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative group">
          <input 
            type="text" 
            placeholder="הזן שם לתרגיל החדש..." 
            value={newSubExName} 
            onChange={e => setNewSubExName(e.target.value)} 
            required 
            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-zinc-900 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all placeholder:text-zinc-300"
          />
        </div>
        
        <button 
          type="submit" 
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-100 active:scale-95 whitespace-nowrap"
        >
          צור תרגיל
        </button>
      </form>

      {/* Helper Text */}
      <p className="mt-4 text-[10px] font-bold text-zinc-400 mr-2 italic">
        * תת-תרגיל ייווצר תחת הקטגוריה הנוכחית ויירש את הגדרות המאמן שלה.
      </p>
    </div>
  );
};

export default SubExerciseCreator;