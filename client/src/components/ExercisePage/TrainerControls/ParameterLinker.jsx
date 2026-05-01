import React, { useState, useMemo } from 'react';
import ParameterForm from '../../Parameters/ParameterForm';

const ParameterLinker = ({ parameters, onLinkParam, onAfterCreate }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // מנוע חיפוש פנימי לפרמטרים הזמינים
  const filteredParams = useMemo(() => {
    return parameters.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.unit.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [parameters, searchTerm]);

  return (
    <div className="p-6 bg-white border border-zinc-100 rounded-[2.5rem] shadow-sm font-sans" dir="rtl">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">🔗</span>
            <h4 className="text-sm font-black text-zinc-800 uppercase tracking-widest">קישור פרמטרים</h4>
          </div>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">בחר פרמטרים קיימים או צור חדש</p>
        </div>

        <button 
          onClick={() => setIsCreating(!isCreating)}
          className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${
            isCreating 
            ? 'bg-zinc-100 text-zinc-500' 
            : 'bg-zinc-900 text-white hover:bg-zinc-800'
          }`}
        >
          {isCreating ? 'ביטול' : '+ פרמטר חדש'}
        </button>
      </div>

      {/* Inline Creation Form */}
      {isCreating && (
        <div className="mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-3xl animate-in fade-in slide-in-from-top-2 duration-300">
           <ParameterForm onSuccess={(newParam) => {
               setIsCreating(false);
               onAfterCreate(newParam);
           }} />
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-6">
        <input 
          type="text"
          placeholder="חפש פרמטר (משקל, חזרות, זמן...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 text-xs font-bold text-zinc-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all placeholder:text-zinc-300"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 text-xs">🔍</span>
      </div>
      
      {/* Parameters Grid - Compact Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
        {filteredParams.length > 0 ? (
          filteredParams.map(p => (
            <button 
              key={p.id}
              onClick={() => onLinkParam(p.id)}
              className={`group flex items-center justify-between p-3 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                p.is_virtual 
                ? 'bg-blue-50/30 border-blue-100 hover:border-blue-300' 
                : 'bg-white border-zinc-100 hover:border-zinc-300'
              }`}
            >
              <div className="flex flex-col items-start overflow-hidden">
                <div className="flex items-center gap-1.5 w-full">
                  <span className="text-xs font-black text-zinc-900 truncate tracking-tight">{p.name}</span>
                  {p.is_virtual && (
                    <span className="text-[7px] font-black bg-blue-600 text-white px-1 py-0.5 rounded uppercase">V</span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase leading-none">{p.unit}</span>
              </div>

              <div className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                <span className="text-xs font-bold">+</span>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full py-10 text-center">
            <p className="text-xs font-bold text-zinc-300 italic tracking-widest uppercase">No parameters found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParameterLinker;