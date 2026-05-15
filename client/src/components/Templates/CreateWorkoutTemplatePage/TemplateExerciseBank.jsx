import React, { useState, useContext } from 'react';
import { ExerciseContext } from '../../../contexts/ExerciseContext'; 
import { ParameterContext } from '../../../contexts/ParameterContext'; 
import { useToast } from '../../../hooks/useToast';

/**
 * TemplateExerciseBank Component - Renders available flat registry exercises.
 * Features an integrated inline creator to define new exercises and assign logging metrics.
 * Styled completely with premium Arctic Mirror glassmorphic patterns.
 */
const TemplateExerciseBank = ({ loading, availableExercises, onAdd }) => {
  const { addExercise } = useContext(ExerciseContext);
  const { parameters } = useContext(ParameterContext);
  const { showToast } = useToast();

  // Component local states for the inline creation wizard
  const [isCreating, setIsCreating] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [selectedParamIds, setSelectedParamIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Toggles parameter metrics selection chips state tracking.
   */
  const handleToggleParam = (paramId) => {
    setSelectedParamIds(prev => 
      prev.includes(paramId) 
        ? prev.filter(id => id !== paramId) 
        : [...prev, paramId]
    );
  };

  /**
   * Commits the new custom exercise definition directly into the global flat registry context.
   */
  const handleCreateExercise = async (e) => {
    e.preventDefault();
    if (!newExerciseName.trim()) {
      showToast("יש להזין שם תרגיל", "warning");
      return;
    }
    if (selectedParamIds.length === 0) {
      showToast("יש לבחור לפחות פרמטר מדידה אחד", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: newExerciseName.trim(),
        active_parameter_ids: selectedParamIds.map(Number),
        category: "General" // Baseline fallback tag definition under pure flat structures
      };

      // Create exercise definition globally in context cache
      if (addExercise) {
        await addExercise(payload);
      }
      
      showToast("התרגיל התווסף למאגר הגלובלי בהצלחה!", "success");
      
      // Reset states and collapse the configuration workspace panel
      setNewExerciseName('');
      setSelectedParamIds([]);
      setIsCreating(false);
    } catch (err) {
      showToast("שגיאה בהוספת תרגיל חדש למאגר", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/30 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-8 shadow-inner space-y-6">
      
      {/* Dynamic Sub-header layout block with setup context toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mr-2">
        <div className="space-y-0.5">
          <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">
            בנק תרגילים זמינים (לחץ להוספה):
          </h4>
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Global Flat Registry Stock Pool</p>
        </div>
        
        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm ${
            isCreating 
              ? 'bg-rose-500 text-white shadow-rose-500/10' 
              : 'bg-white text-zinc-900 border border-zinc-100 hover:bg-zinc-50'
          }`}
        >
          {isCreating ? '✕ סגור טופס' : '＋ תרגיל חדש במאגר'}
        </button>
      </div>

      {/* --- EXPANDABLE INLINE CREATOR WORKSPACE PANEL --- */}
      {isCreating && (
        <div className="bg-white/50 backdrop-blur-2xl border border-white/80 rounded-3xl p-6 shadow-md animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
          <div className="space-y-1">
            <h5 className="text-base font-black text-zinc-900 tracking-tight">הגדרת תרגיל גלובלי חדש</h5>
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Compile New Core Exercise Properties</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Input Name field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם התרגיל</label>
              <input 
                type="text"
                placeholder="למשל: לחיצת כתפיים בישיבה עם משקולות"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                className="w-full bg-white border border-zinc-100 rounded-xl px-5 py-3.5 text-sm font-bold text-zinc-900 outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all shadow-inner placeholder:text-zinc-300"
              />
            </div>

            {/* Metrics Configuration / Parameter selection chips list */}
            <div className="space-y-3">
              <div className="space-y-0.5 mr-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">פרמטרי מדידה לרישום</label>
                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Assign Active Tracking Parameters (Non-Virtual Only)</p>
              </div>
              
              <div className="flex flex-wrap gap-2.5 p-1">
                {parameters.filter(p => !p.is_virtual).map(param => {
                  const isChecked = selectedParamIds.includes(param.id);
                  return (
                    <button
                      key={param.id}
                      type="button"
                      onClick={() => handleToggleParam(param.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-300 active:scale-95 flex items-center gap-2 border shadow-sm ${
                        isChecked
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-md'
                          : 'bg-white/80 text-zinc-500 border-white/90 hover:bg-white hover:text-zinc-900'
                      }`}
                    >
                      {isChecked && <span className="text-blue-400 leading-none">✓</span>}
                      <span>{param.name}</span>
                      <span className={`text-[9px] font-bold ${isChecked ? 'text-zinc-400' : 'text-zinc-300'}`}>({param.unit || 'יח\''})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action trigger commit state buttons */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleCreateExercise}
              disabled={isSubmitting || !newExerciseName.trim()}
              className="px-6 py-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-blue-500/10 transition-all active:scale-95 disabled:opacity-20"
            >
              {isSubmitting ? 'שומר במאגר...' : 'שמור והוסף למאגר 💾'}
            </button>
          </div>
        </div>
      )}

      {/* --- STANDARD HORIZONTAL EXERCISE CHIPS CAROUSEL --- */}
      {loading ? (
        <div className="flex items-center gap-3 py-6 px-4">
          <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          <p className="text-zinc-400 font-black tracking-widest uppercase text-[10px]">Loading Global Registry Pool...</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 pr-1 pl-2 scrollbar-hide snap-x min-h-[70px]">
          {availableExercises.map((exercise) => (
            <button 
              key={exercise.id}
              type="button"
              onClick={() => onAdd(exercise)}
              className="flex-none snap-start flex items-center gap-3 px-6 py-3.5 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl shadow-sm hover:shadow-xl hover:bg-white hover:border-zinc-300 group transition-all duration-300 active:scale-95"
            >
              <span className="w-6 h-6 flex items-center justify-center bg-zinc-900 text-white rounded-lg text-[10px] font-black transition-transform group-hover:rotate-90">
                ＋
              </span>
              <span className="text-zinc-900 font-black text-sm tracking-tight">
                {exercise.name}
              </span>
            </button>
          ))}

          {availableExercises.length === 0 && !isCreating && (
            <div className="w-full py-6 px-6 bg-white/10 rounded-2xl border-2 border-dashed border-white/40 text-center">
              <p className="text-zinc-400 font-black text-xs tracking-wide uppercase italic">מאגר התרגילים הגלובלי ריק כעת. לחץ על הכפתור למעלה כדי ליצור תרגיל ראשון.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TemplateExerciseBank;