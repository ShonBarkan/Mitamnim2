import React, { useState, useMemo } from 'react';
import { useParameter } from '../../../contexts/ParameterContext';

/**
 * ParameterTable Component - Renders the data grid visualizing active registered metrics.
 * Updated to dynamically resolve and render human-readable formulas (e.g., "Reps * Weight").
 * Fully responsive: Renders as a data table on desktop and dynamic individual cards on mobile.
 * Includes real-time search filtering with performance optimization via useMemo.
 */
const ParameterTable = ({ parameters, loading, startEdit, handleDelete }) => {
  const { getParameterNameById } = useParameter();
  
  // State management for search term
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Translates database system operator tokens into standard mathematical symbols.
   */
  const getOperatorSymbol = (type) => {
    switch (type) {
      case 'multiply': return '*';
      case 'divide': return '/';
      case 'sum': return '+';
      case 'subtract': return '-';
      case 'percentage': return '/';
      default: return '';
    }
  };

  /**
   * Dynamic Formula Resolver: Compiles raw configuration states into human-readable Hebrew text format expressions.
   */
  const renderFormulaText = (param) => {
    if (!param.is_virtual || !param.source_parameter_ids || param.source_parameter_ids.length === 0) {
      return <span className="text-zinc-400 font-mono text-[11px]">מדד בסיס גולמי [סיכום: {param.aggregation_strategy}]</span>;
    }

    // Handle Type 2: Conversion parameter layout rendering
    if (param.calculation_type === 'conversion') {
      const baseParamName = getParameterNameById(param.source_parameter_ids[0]);
      return (
        <span className="bg-orange-50/60 px-3 py-1 rounded-lg border border-orange-100/40 font-bold text-[11px] text-orange-600 inline-block text-right break-words max-w-full">
          {baseParamName} * {param.multiplier}
        </span>
      );
    }

    // Handle Type 3: Advanced multi-parameter combination formula tracking
    const paramAName = getParameterNameById(param.source_parameter_ids[0]);
    const paramBName = getParameterNameById(param.source_parameter_ids[1]);
    const symbol = getOperatorSymbol(param.calculation_type);
    
    // Append trailing components depending on percentage configurations or factor rules
    const trailingMultiplier = param.multiplier !== 1 && param.calculation_type !== 'percentage' ? ` * ${param.multiplier}` : '';
    const trailingPercentage = param.calculation_type === 'percentage' ? ' * 100' : '';

    return (
      <span className="bg-purple-50/60 px-3 py-1 rounded-lg border border-purple-100/40 font-bold text-[11px] text-purple-600 inline-block text-right break-words max-w-full">
        {paramAName} {symbol} {paramBName}{trailingMultiplier}{trailingPercentage}
      </span>
    );
  };

  /**
   * Badge Renderer: Generates the visual indicator for parameter types.
   */
  const renderTypeBadge = (param) => {
    const isBase = !param.is_virtual;
    const isConversion = param.calculation_type === 'conversion';
    
    const baseClasses = "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider whitespace-nowrap";
    const colorClasses = isBase 
      ? 'bg-blue-100 text-blue-700' 
      : isConversion 
      ? 'bg-orange-100 text-orange-700' 
      : 'bg-purple-100 text-purple-700';
      
    const label = isBase ? 'רגיל 🛠️' : isConversion ? 'המרה 🔄' : 'שילוב 🧬';

    return <span className={`${baseClasses} ${colorClasses}`}>{label}</span>;
  };

  // Memoized filtering logic to prevent unnecessary re-renders while typing
  const filteredParameters = useMemo(() => {
    if (!searchTerm.trim()) return parameters;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return parameters.filter(param =>
      param.name.toLowerCase().includes(lowerSearchTerm) ||
      (param.unit && param.unit.toLowerCase().includes(lowerSearchTerm))
    );
  }, [parameters, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Glassmorphism search input following Arctic Mirror aesthetic */}
      <div className="relative">
        <input
          type="text"
          placeholder="חיפוש מדדים..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-zinc-200/40 rounded-2xl text-sm font-bold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/30 transition-all shadow-sm"
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-300 select-none pointer-events-none">🔍</span>
      </div>

      {/* Main Data Container - Adapts rendering mode based on screen width */}
      <div className="border-none md:border md:border-zinc-100 md:rounded-2xl md:overflow-hidden md:shadow-sm md:bg-white/20 transition-all">
        
        {/* --- DESKTOP VIEW: Traditional Table Layout --- */}
        <table className="hidden md:table w-full text-right border-collapse">
          <thead>
            <tr className="bg-zinc-100/50 text-zinc-400 uppercase text-[10px] font-black tracking-wider border-b border-zinc-200/60 select-none">
              <th className="px-6 py-4">סוג המדד</th>
              <th className="px-6 py-4">שם המדד</th>
              <th className="px-6 py-4">יחידה</th>
              <th className="px-6 py-4">נוסחה / חוקיות מערכת</th>
              <th className="px-6 py-4 text-left">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-10 text-center text-xs font-bold text-zinc-400 uppercase animate-pulse">מסנכרן הגדרות מדדים...</td>
              </tr>
            ) : filteredParameters.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-10 text-center text-xs font-bold text-zinc-300 italic">
                  {searchTerm.trim() ? 'לא נמצאו מדדים התואמים לחיפוש' : 'לא הוגדרו עדיין פרמטרי מדידה בקבוצה זו'}
                </td>
              </tr>
            ) : (
              filteredParameters.map(param => (
                <tr key={param.id} className="group transition-all hover:bg-white/40">
                  <td className="px-6 py-4 select-none">
                    {renderTypeBadge(param)}
                  </td>
                  <td className="px-6 py-4 font-black text-zinc-900 text-sm">{param.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">{param.unit || '-'}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-600">
                    {renderFormulaText(param)}
                  </td>
                  <td className="px-6 py-4 text-left">
                    {/* Actions hidden by default until row hover */}
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => startEdit(param)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors active:scale-90" title="ערוך מדד">✏️</button>
                      <button type="button" onClick={() => handleDelete(param.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors active:scale-90" title="מחק מדד">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* --- MOBILE VIEW: Interactive Card List --- */}
        <div className="md:hidden flex flex-col gap-3">
          {loading ? (
            <div className="p-8 text-center text-xs font-bold text-zinc-400 uppercase animate-pulse bg-white/20 rounded-2xl border border-zinc-100 shadow-sm">
              מסנכרן הגדרות מדדים...
            </div>
          ) : filteredParameters.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-zinc-300 italic bg-white/20 rounded-2xl border border-zinc-100 shadow-sm">
              {searchTerm.trim() ? 'לא נמצאו מדדים התואמים לחיפוש' : 'לא הוגדרו עדיין פרמטרי מדידה בקבוצה זו'}
            </div>
          ) : (
            filteredParameters.map(param => (
              <div 
                key={param.id} 
                className="bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl p-4 flex flex-col gap-4 shadow-sm transition-all active:scale-[0.98]"
              >
                {/* Header: Name, Unit, and Badge */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-base text-zinc-900 leading-none">{param.name}</span>
                    <span className="font-mono text-xs text-zinc-500 font-bold bg-white/50 w-fit px-2 py-0.5 rounded-md border border-zinc-100/50">
                      {param.unit ? `יחידה: ${param.unit}` : 'ללא יחידה'}
                    </span>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {renderTypeBadge(param)}
                  </div>
                </div>

                {/* Formula Payload Block */}
                <div className="bg-white/30 rounded-xl p-3 border border-white/40 shadow-inner">
                  {renderFormulaText(param)}
                </div>
                
                {/* Touch-optimized Actions Footer */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/40">
                  <button 
                    type="button" 
                    onClick={() => startEdit(param)} 
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 p-3 bg-blue-50/80 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"
                  >
                    ✏️ ערוך
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleDelete(param.id)} 
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 p-3 bg-red-50/80 text-red-600 font-bold text-xs rounded-xl hover:bg-red-100 transition-colors border border-red-100 shadow-sm"
                  >
                    🗑️ מחק
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default ParameterTable;