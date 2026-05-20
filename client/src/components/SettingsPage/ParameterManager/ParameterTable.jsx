import React from 'react';
import { useParameter } from '../../../contexts/ParameterContext';

/**
 * ParameterTable Component - Renders the data grid visualizing active registered metrics.
 * Updated to dynamically resolve and render human-readable formulas (e.g., "Reps * Weight").
 * Enforces strict English-only code commentary and total Hebrew UI localization.
 */
const ParameterTable = ({ parameters, loading, startEdit, handleDelete }) => {
  const { getParameterNameById } = useParameter();

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
        <span className="bg-orange-50/60 px-3 py-1 rounded-lg border border-orange-100/40 font-bold text-[11px] text-orange-600">
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
      <span className="bg-purple-50/60 px-3 py-1 rounded-lg border border-purple-100/40 font-bold text-[11px] text-purple-600">
        {paramAName} {symbol} {paramBName}{trailingMultiplier}{trailingPercentage}
      </span>
    );
  };

  return (
    <div className="border border-zinc-100 rounded-2xl overflow-hidden shadow-sm bg-white/20">
      <table className="w-full text-right border-collapse">
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
          ) : parameters.length === 0 ? (
            <tr>
              <td colSpan="5" className="p-10 text-center text-xs font-bold text-zinc-300 italic">לא הוגדרו עדיין פרמטרי מדידה בקבוצה זו</td>
            </tr>
          ) : (
            parameters.map(param => (
              <tr key={param.id} className="group transition-all hover:bg-white/40">
                <td className="px-6 py-4 select-none">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    !param.is_virtual 
                      ? 'bg-blue-100 text-blue-700' 
                      : param.calculation_type === 'conversion' 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {!param.is_virtual ? 'רגיל 🛠️' : param.calculation_type === 'conversion' ? 'המרה 🔄' : 'שילוב 🧬'}
                  </span>
                </td>
                <td className="px-6 py-4 font-black text-zinc-900 text-sm">{param.name}</td>
                <td className="px-6 py-4 font-mono text-xs text-zinc-500">{param.unit}</td>
                <td className="px-6 py-4 text-xs font-bold text-zinc-600">
                  {renderFormulaText(param)}
                </td>
                <td className="px-6 py-4 text-left">
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
    </div>
  );
};

export default ParameterTable;