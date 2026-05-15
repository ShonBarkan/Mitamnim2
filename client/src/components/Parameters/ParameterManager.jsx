import React, { useContext, useEffect, useState } from 'react';
import { ParameterContext } from '../../contexts/ParameterContext';
import { useAuth } from '../../hooks/useAuth';
import { useStats } from '../../contexts/StatsContext';
import StatsSettingsGroup from './StatsSettingsGroup';
import ParameterForm from './ParameterForm';

/**
 * ParameterManager Component - Administrative interface for measurement logic.
 * Implements the "Arctic Mirror" aesthetic with Glassmorphism and modern UI patterns.
 */
const ParameterManager = () => {
  const { user } = useAuth();
  const { 
    parameters, 
    fetchParameters, 
    removeParameter, 
    editParameter, 
    loading 
  } = useContext(ParameterContext);
  const { refreshAllConfigs } = useStats(); 
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  const strategies = [
    { id: 'sum', label: 'Sum' },
    { id: 'max', label: 'Personal Best (Max)' },
    { id: 'min', label: 'Minimum / Time (Min)' },
    { id: 'avg', label: 'Average (Avg)' },
    { id: 'latest', label: 'Latest Entry' },
  ];

  // Initial data synchronization
  useEffect(() => {
    fetchParameters();
    refreshAllConfigs(); 
  }, [fetchParameters, refreshAllConfigs]);

  /**
   * Prepares the editing state for a specific parameter.
   */
  const handleStartEdit = (param) => {
    setEditingId(param.id);
    setEditData({ 
      name: param.name, 
      unit: param.unit, 
      aggregation_strategy: param.aggregation_strategy || 'sum',
      multiplier: param.multiplier || 1.0,
      source_parameter_ids: param.source_parameter_ids || []
    });
  };

  /**
   * Saves updated metadata back to the registry.
   */
  const handleSaveEdit = async (id) => {
    try {
      await editParameter(id, { 
        ...editData, 
        group_id: user.group_id 
      });
      setEditingId(null);
    } catch (err) {
      console.error("ParameterManager: Update failed", err);
    }
  };

  /**
   * Renders the underlying calculation logic in a readable code format.
   */
  const renderLogic = (param) => {
    if (!param.is_virtual) return <span className="opacity-20">—</span>;
    
    const sourceNames = param.source_parameter_ids
      ?.map(id => parameters.find(p => p.id === id)?.name || `ID:${id}`);

    if (!sourceNames || sourceNames.length === 0) {
      return <code className="text-red-400 font-bold bg-red-50 px-2 py-1 rounded-md text-[10px]">LOGIC_ERROR</code>;
    }

    const logicColors = {
      conversion: "text-emerald-500",
      sum: "text-blue-500",
      subtract: "text-rose-500",
      multiply: "text-amber-500",
      divide: "text-purple-500",
      percentage: "text-orange-500"
    };

    const colorClass = logicColors[param.calculation_type] || "text-zinc-400";

    const content = {
      conversion: `${sourceNames[0]} * ${param.multiplier}`,
      sum: sourceNames.join(' + '),
      subtract: sourceNames.join(' - '),
      multiply: sourceNames.join(' * '),
      divide: sourceNames.join(' / '),
      percentage: `(${sourceNames.join(' / ')}) * 100`
    };

    return (
      <code className={`font-mono font-bold bg-white/50 px-3 py-1.5 rounded-xl text-xs ${colorClass}`}>
        {content[param.calculation_type] || sourceNames.join(' , ')}
      </code>
    );
  };

  return (
    <div className="w-full bg-white/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/60 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] font-sans" dir="rtl">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-white/40">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase">פרמטרים למדידה</h2>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Global Measurement Registry</p>
        </div>

        {isTrainer && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)} 
            className="px-8 py-4 bg-zinc-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-zinc-900/20 active:scale-95 transition-all hover:bg-zinc-800"
          >
            ＋ הוסף פרמטר
          </button>
        )}
      </header>

      {/* --- ADD PARAMETER VIEW --- */}
      {isAdding && (
        <div className="relative mb-12 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[3rem] p-4 shadow-xl">
            <button 
              onClick={() => setIsAdding(false)}
              className="absolute left-8 top-8 w-12 h-12 flex items-center justify-center bg-zinc-100/50 hover:bg-zinc-200/50 rounded-2xl text-zinc-400 hover:text-zinc-900 transition-all z-10"
            >
              ✕
            </button>
            <ParameterForm onSuccess={() => setIsAdding(false)} />
          </div>
        </div>
      )}

      {/* --- REGISTRY TABLE --- */}
      <div className="overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/20">
        {loading ? (
          <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs">
            Synchronizing Registry...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="bg-white/40 text-[11px] font-black uppercase tracking-widest text-zinc-400 border-b border-white/40">
                  <th className="px-8 py-6">Type</th>
                  <th className="px-8 py-6">Parameter Name</th>
                  <th className="px-8 py-6">Unit</th>
                  <th className="px-8 py-6">Calculation Logic</th>
                  <th className="px-8 py-6">Strategy</th>
                  {isTrainer && <th className="px-8 py-6 text-left">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {parameters.map(param => (
                  <tr 
                    key={param.id} 
                    className={`transition-colors group ${editingId === param.id ? 'bg-blue-600/5' : 'hover:bg-white/40'}`}
                  >
                    <td className="px-8 py-6">
                      <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-tighter ${
                        param.is_virtual ? 'bg-blue-600/10 text-blue-600' : 'bg-zinc-100 text-zinc-400'
                      }`}>
                        {param.is_virtual ? 'Virtual' : 'Raw'}
                      </span>
                    </td>

                    {editingId === param.id ? (
                      // Inline Editing UI
                      <>
                        <td className="px-8 py-4">
                          <input 
                            value={editData.name} 
                            onChange={e => setEditData({...editData, name: e.target.value})} 
                            className="w-full bg-white/80 border border-zinc-200 rounded-xl px-4 py-2 text-sm font-bold outline-none" 
                          />
                        </td>
                        <td className="px-8 py-4">
                          <input 
                            value={editData.unit} 
                            onChange={e => setEditData({...editData, unit: e.target.value})} 
                            className="w-16 bg-white/80 border border-zinc-200 rounded-xl px-4 py-2 text-sm font-bold outline-none" 
                          />
                        </td>
                        <td className="px-8 py-4">
                          {param.is_virtual && param.calculation_type === 'conversion' && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-zinc-300">Ratio:</span>
                              <input 
                                type="number" step="0.0001" 
                                value={editData.multiplier} 
                                onChange={e => setEditData({...editData, multiplier: parseFloat(e.target.value)})}
                                className="w-24 bg-white/80 border border-zinc-200 rounded-xl px-4 py-2 text-sm font-bold outline-none" 
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-4">
                          <select 
                            value={editData.aggregation_strategy} 
                            onChange={e => setEditData({...editData, aggregation_strategy: e.target.value})} 
                            className="w-full bg-white/80 border border-zinc-200 rounded-xl px-4 py-2 text-sm font-bold outline-none"
                          >
                            {strategies.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                        </td>
                        <td className="px-8 py-4 text-left">
                          <div className="flex justify-end gap-3">
                            <button onClick={() => handleSaveEdit(param.id)} className="text-emerald-500 font-black text-xs uppercase">Save</button>
                            <button onClick={() => setEditingId(null)} className="text-zinc-400 font-black text-xs uppercase">Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // Standard Display UI
                      <>
                        <td className="px-8 py-6 font-black text-zinc-900 text-lg tracking-tight">{param.name}</td>
                        <td className="px-8 py-6 font-bold text-zinc-500">{param.unit}</td>
                        <td className="px-8 py-6">{renderLogic(param)}</td>
                        <td className="px-8 py-6">
                          <span className="text-[11px] font-bold text-zinc-400 bg-zinc-100/50 px-3 py-1 rounded-lg">
                            {strategies.find(s => s.id === param.aggregation_strategy)?.label || param.aggregation_strategy}
                          </span>
                        </td>
                        {isTrainer && (
                          <td className="px-8 py-6 text-left">
                            <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleStartEdit(param)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors">✏️</button>
                              <button onClick={() => { if(window.confirm('Delete this parameter?')) removeParameter(param.id) }} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors">🗑</button>
                            </div>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADDITIONAL CONFIGS --- */}
      {isTrainer && (
        <div className="mt-12 pt-12 border-t border-white/40">
           <StatsSettingsGroup />
        </div>
      )}
    </div>
  );
};

export default ParameterManager;