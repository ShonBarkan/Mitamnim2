import React, { useState, useEffect, useContext, useMemo } from 'react';
import { ExerciseContext } from '../../../contexts/ExerciseContext';
import { ParameterContext } from '../../../contexts/ParameterContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import FrontendLogger from '../../../utils/logger';

/**
 * ExerciseRegistryManager Component - Flat registry manager for squad exercise definitions.
 * Refactored: Fully supports the flat database data schema using unified 'exercise_name' models.
 * Relocated: Positioned inside components/common/Exercises/ for shared system-wide visibility.
 */
const ExerciseRegistryManager = () => {
  const { user } = useAuth();
  const { exercises, fetchExercises, addExercise, removeExercise, editExercise, loading } = useContext(ExerciseContext);
  const { parameters } = useContext(ParameterContext);
  const { showToast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);

  const initialFormState = { exercise_name: '', category: '', active_parameter_ids: [] };
  const [formData, setFormData] = useState(initialFormState);

  const isAuthorized = user?.role === 'trainer' || user?.role === 'admin';

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  /**
   * Filters the flat registry stock pool based on query strings (Name or Category tag metrics).
   */
  const filteredExercises = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return exercises;

    return exercises.filter(ex => 
      (ex.exercise_name || '').toLowerCase().includes(query) ||
      (ex.category || '').toLowerCase().includes(query)
    );
  }, [exercises, searchTerm]);

  const handleStartEdit = (ex) => {
    FrontendLogger.info('EXERCISE_REGISTRY_MANAGER', `Hydrating editor form wizard row with entity index ID: ${ex.id}`);
    setEditingId(ex.id);
    setFormData({
      exercise_name: ex.exercise_name || '',
      category: ex.category || '',
      active_parameter_ids: ex.active_parameter_ids || []
    });
    setIsAdding(true);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  /**
   * Encapsulates form modifications and commits payload streams downstream over networks.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    FrontendLogger.info('EXERCISE_REGISTRY_MANAGER', 'Triggered form package blueprint verification chain');

    if (!formData.exercise_name.trim()) {
      showToast("יש להזין שם תרגיל תקני", "warning");
      return;
    }

    try {
      const payload = { 
        exercise_name: formData.exercise_name.trim(), 
        category: formData.category.trim() || 'General',
        active_parameter_ids: formData.active_parameter_ids.map(Number),
        group_id: user?.group_id || null 
      };

      if (editingId) {
        await editExercise(editingId, payload);
        showToast("התרגיל עודכן בהצלחה במאגר הקבוצתי", "success");
      } else {
        await addExercise(payload);
        showToast("תרגיל חדש נוסף ואושרר בהצלחה במאגר", "success");
      }
      cancelForm();
    } catch (err) {
      FrontendLogger.error('EXERCISE_REGISTRY_MANAGER', 'Operational submission error caught on registry database transactions', err);
      showToast("שגיאה בתהליך שמירת התרגיל", "error");
    }
  };

  const toggleParameter = (paramId) => {
    FrontendLogger.info('EXERCISE_REGISTRY_MANAGER', `Toggling tracking linkage validation key parameter index: ${paramId}`);
    setFormData(prev => {
      const ids = prev.active_parameter_ids.includes(paramId)
        ? prev.active_parameter_ids.filter(id => id !== paramId)
        : [...prev.active_parameter_ids, paramId];
      return { ...prev, active_parameter_ids: ids };
    });
  };

  const handleDeleteRequest = (exId) => {
    FrontendLogger.warn('EXERCISE_REGISTRY_MANAGER', `Trainer requested absolute removal of exercise entity row index ID: ${exId}`);
    if (window.confirm('האם אתה בטוח לחלוטין שברצונך למחוק לצמיתות את התרגיל הזה ממאגר המערכת?')) {
      removeExercise(exId);
      showToast("התרגיל הוסר בהצלחה מהמאגר", "success");
    }
  };

  return (
    <div className="space-y-8 font-sans" dir="rtl">
      
      {/* Search & Add Global Command Actions Layout Block */}
      <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96 group">
          <input 
            type="text" 
            placeholder="חיפוש תרגיל או קטגוריה..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/50 border border-white/60 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all shadow-inner placeholder:text-zinc-300"
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 opacity-30 select-none pointer-events-none">🔍</span>
        </div>
        
        {isAuthorized && !isAdding && (
          <button 
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all shrink-0"
          >
            ＋ תרגיל חדש
          </button>
        )}
      </div>

      {/* Editor Context Form Wizard Overlay */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/60 shadow-2xl animate-in fade-in zoom-in-95 duration-400 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900 m-0 leading-none">
              {editingId ? 'עריכת הגדרות תרגיל' : 'רישום תרגיל חדש'}
            </h3>
            <button 
              type="button" 
              onClick={cancelForm} 
              className="w-8 h-8 rounded-full bg-white/80 border border-white/90 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors shadow-sm active:scale-90"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2 select-none">שם התרגיל</label>
              <input 
                type="text"
                value={formData.exercise_name}
                onChange={e => setFormData({...formData, exercise_name: e.target.value})}
                className="w-full bg-white border border-zinc-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 shadow-inner placeholder:text-zinc-300"
                placeholder="למשל: סקווט אחורי חופשי"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2 select-none">קטגוריה / תגית</label>
              <input 
                type="text"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-white border border-zinc-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 shadow-inner placeholder:text-zinc-300"
                placeholder="e.g., ג'ודו, כוח, אירובי"
              />
            </div>
          </div>

          {/* Parameter Grid Checking Linking Section Frame */}
          <div className="space-y-3">
            <div className="space-y-0.5 mr-2 select-none">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">שיוך פרמטרים למדידה ואיסוף</label>
              <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Assign Active Raw Measurement Tracking Fields (Non-Virtual Only)</p>
            </div>
            <div className="flex flex-wrap gap-2.5 max-h-40 overflow-y-auto p-4 bg-white/20 rounded-2xl border border-white/40 scrollbar-hide shadow-inner">
              {parameters.filter(p => !p.is_virtual).map(p => {
                const isSelected = formData.active_parameter_ids.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleParameter(p.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 border ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-md'
                        : 'bg-white/80 text-zinc-500 border-white/90 hover:bg-white hover:text-zinc-900'
                    }`}
                  >
                    {isSelected && <span className="text-blue-400 ml-1.5 font-sans">✓</span>}
                    <span>{p.name}</span>
                    {p.unit && <span className="text-[9px] font-bold opacity-50 font-mono"> ({p.unit})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submission and Abort Actions Control Buttons Section */}
          <div className="flex gap-4 pt-2">
            <button type="submit" className="flex-[2] bg-zinc-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] hover:bg-zinc-800 border border-zinc-900">
              שמור במאגר
            </button>
            <button type="button" onClick={cancelForm} className="flex-1 bg-white/60 text-zinc-500 font-black text-xs uppercase tracking-widest rounded-2xl border border-white hover:bg-white hover:text-zinc-900 active:scale-95 shadow-sm">
              ביטול
            </button>
          </div>
        </form>
      )}

      {/* Persistent Registry Stock Rows Feed */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-zinc-400 font-black uppercase tracking-[0.3em] text-[10px]">Syncing Global Flat Pool Registry...</p>
          </div>
        ) : (
          filteredExercises.map(ex => (
            <div key={ex.id} className="group bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-[2rem] flex justify-between items-center hover:bg-white/60 transition-all duration-500 hover:shadow-md shadow-sm">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
                    {ex.exercise_name}
                  </span>
                  {ex.category && ex.category !== 'General' && (
                    <span className="bg-blue-600/5 border border-blue-500/10 text-blue-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest select-none">
                      {ex.category}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono select-none">
                  Metrics: {ex.active_parameter_ids?.length || 0} Fields Associated
                </div>
              </div>

              {isAuthorized && (
                <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 sm:translate-y-0 group-hover:translate-y-0 shrink-0">
                  <button 
                    type="button"
                    onClick={() => handleStartEdit(ex)} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/80 border border-white shadow-sm text-zinc-400 hover:text-zinc-900 hover:scale-105 transition-all active:scale-90"
                    title="ערוך תרגיל"
                  >
                    ✏️
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleDeleteRequest(ex.id)} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white hover:scale-105 transition-all shadow-sm active:scale-90"
                    title="מחק תרגיל מהרישום"
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        {filteredExercises.length === 0 && !loading && (
          <div className="py-16 text-center bg-white/10 rounded-[2.5rem] border-2 border-dashed border-white/40 select-none pointer-events-none">
            <span className="text-2xl opacity-30 block mb-2">🔎</span>
            <p className="text-zinc-400 font-black text-xs uppercase tracking-widest italic m-0">לא נמצאו תרגילים תואמים ברישום המערכת</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseRegistryManager;