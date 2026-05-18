import React, { useState, useEffect, useContext } from 'react';
import { StatsContext } from '../../contexts/StatsContext';
import { ParameterContext } from '../../contexts/ParameterContext';
import { ExerciseContext } from '../../contexts/ExerciseContext';
import { ToastContext } from '../../contexts/ToastContext';
import FrontendLogger from '../../utils/logger';

/**
 * DashboardConfig Component - System scoreboard layout and visibility supervisor.
 * Governs which exercises and tracking metrics get featured on the public landing page leaderboard.
 * Fully refactored to adhere to pure useContext abstractions and Arctic Mirror styling guidelines.
 */
const DashboardConfig = () => {
  const { dashboardConfigs = [], loading, refreshAllConfigs, addDashboardConfig, updateDashboardConfig, removeDashboardConfig } = useContext(StatsContext);
  const { parameters = [], fetchParameters } = useContext(ParameterContext);
  const { exercises = [], fetchExercises } = useContext(ExerciseContext);
  const { showToast } = useContext(ToastContext);

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    exercise_name: '',
    parameter_id: '',
    display_type: 'leaderboard', // Options: 'leaderboard' | 'chart' | 'summary'
    sort_order: 1
  });

  // Pull all tracking parameters, flat exercises and active board rules on mount
  useEffect(() => {
    FrontendLogger.info('DASHBOARD_CONFIG', 'Synchronizing dependencies matrix portfolio for display rules manager');
    if (refreshAllConfigs) refreshAllConfigs();
    if (fetchParameters) fetchParameters();
    if (fetchExercises) fetchExercises();
  }, [refreshAllConfigs, fetchParameters, fetchExercises]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'parameter_id' || name === 'sort_order' ? (value ? parseInt(value) : '') : value
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      exercise_name: '',
      parameter_id: '',
      display_type: 'leaderboard',
      sort_order: dashboardConfigs.length + 1
    });
  };

  /**
   * Transfers targeted rule coordinates directly into input elements for inline editing
   */
  const startEdit = (config) => {
    FrontendLogger.info('DASHBOARD_CONFIG', `Entering modification alignment for board rule target node id: ${config.id}`);
    setEditingId(config.id);
    setFormData({
      title: config.title || '',
      exercise_name: config.exercise_name || '',
      parameter_id: config.parameter_id || '',
      display_type: config.display_type || 'leaderboard',
      sort_order: config.sort_order || 1
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Commits the updated blueprint rules or dispatches a new display target definition
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    FrontendLogger.info('DASHBOARD_CONFIG', 'Intercepted configuration layout transaction submission request');

    if (!formData.title || !formData.exercise_name || !formData.parameter_id) {
      showToast("אנא מלא את כל שדות החובה להגדרת התצוגה", "error");
      return;
    }

    try {
      if (editingId) {
        await updateDashboardConfig(editingId, formData);
        showToast("חוקיות תצוגת הדשבורד עודכנה בהצלחה", "success");
      } else {
        await addDashboardConfig(formData);
        showToast("מדד תחרותי חדש הוצמד ללוח הראשי", "success");
      }
      resetForm();
    } catch (error) {
      FrontendLogger.error('DASHBOARD_CONFIG', 'Failed to commit configuration matrix property variations', error);
      showToast("שגיאה בשמירת הגדרות התצוגה", "error");
    }
  };

  const handleDelete = async (id) => {
    FrontendLogger.warn('DASHBOARD_CONFIG', `Executing destruction sequence for dashboard layout tracking entity id: ${id}`);
    if (window.confirm("האם אתה בטוח שברצונך להסיר מדד זה מלוח התצוגה הציבורי?")) {
      try {
        await removeDashboardConfig(id);
        showToast("המדד הוסר בהצלחה מהלוח הפומבי", "success");
        if (editingId === id) resetForm();
      } catch (error) {
        showToast("שגיאה במחיקת הגדרת תצוגה", "error");
      }
    }
  };

  return (
    <div className="space-y-10 font-sans" dir="rtl">
      
      {/* --- BLUEPRINT ENTRY MATRIX FORM CARD --- */}
      <div className="bg-white/40 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/60 shadow-xl">
        <div className="flex items-center gap-3 mb-6 select-none">
          <div className={`w-2.5 h-2.5 rounded-full ${editingId ? 'bg-orange-500 animate-pulse' : 'bg-zinc-900'}`} />
          <h3 className="text-xl font-black text-zinc-900 m-0 leading-none">
            {editingId ? 'עריכת כלל חשיפה קיים' : 'הצמדת מדד תחרותי חדש לדף הבית'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            
            {/* Display Title input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2 select-none">כותרת המדד הציבורי</label>
              <input type="text" name="title" placeholder="Leaderboard Title" value={formData.title} onChange={handleInputChange} className="w-full bg-white border border-zinc-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all shadow-sm placeholder:text-zinc-300" />
            </div>

            {/* Flat Exercise Selector mapping names */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2 select-none">תרגיל היעד</label>
              <select name="exercise_name" value={formData.exercise_name} onChange={handleInputChange} className="w-full bg-white border border-zinc-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 appearance-none transition-all shadow-sm text-zinc-700">
                <option value="">-- בחר תרגיל --</option>
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.exercise_name}>{ex.exercise_name}</option>
                ))}
              </select>
            </div>

            {/* Target Tracking Parameters selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2 select-none">הפרמטר המוביל למדידה</label>
              <select name="parameter_id" value={formData.parameter_id} onChange={handleInputChange} className="w-full bg-white border border-zinc-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 appearance-none transition-all shadow-sm text-zinc-700">
                <option value="">-- בחר פרמטר --</option>
                {parameters.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                ))}
              </select>
            </div>

            {/* Layout Presentation Mode Style */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2 select-none">פורמט ויזואליזציה</label>
              <select name="display_type" value={formData.display_type} onChange={handleInputChange} className="w-full bg-white border border-zinc-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 appearance-none transition-all shadow-sm text-zinc-700">
                <option value="leaderboard">🏆 טבלת דירוג שיאים (Leaderboard)</option>
                <option value="chart">📈 גרף מגמה כרונולוגי (Trend Chart)</option>
                <option value="summary">💎 כרטיס סיכום נפח (Analytics Summary)</option>
              </select>
            </div>

            {/* Sort Order Priority hierarchy */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2 select-none">סדר עדיפות בלוח</label>
              <input type="number" min="1" name="sort_order" value={formData.sort_order} onChange={handleInputChange} className="w-full bg-white border border-zinc-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all shadow-sm font-mono" />
            </div>

          </div>

          {/* Form Command Buttons Row */}
          <div className="flex justify-end gap-3 border-t border-zinc-950/5 pt-4">
            {editingId && (
              <button type="button" onClick={resetForm} className="px-6 py-3 bg-white border border-zinc-100 rounded-xl text-zinc-500 font-bold text-xs hover:bg-zinc-50 hover:text-zinc-900 transition-all active:scale-95 shadow-sm">
                ביטול
              </button>
            )}
            <button type="submit" className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-zinc-800 transition-all active:scale-95 border border-zinc-900">
              {editingId ? 'שמור שינויי תצוגה' : 'הצמד מדד לדף הבית'}
            </button>
          </div>
        </form>
      </div>

      {/* --- LIVE DISPLAY LAYOUT CONFIGURATION DIRECTORY TABLE --- */}
      <div className="border border-white/60 rounded-[2rem] overflow-hidden shadow-xl bg-white/40 backdrop-blur-2xl">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-white/60 text-zinc-400 uppercase text-[10px] font-black tracking-wider border-b border-white select-none">
              <th className="px-6 py-4 text-center">מיקום / סדר</th>
              <th className="px-6 py-4">שם כותרת התצוגה</th>
              <th className="px-6 py-4">תרגיל משויך</th>
              <th className="px-6 py-4">פרמטר מוצג</th>
              <th className="px-6 py-4">סגנון תצוגה</th>
              <th className="px-6 py-4 text-left">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/40">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-12 text-center text-xs font-black text-zinc-400 uppercase tracking-[0.3em] animate-pulse font-mono">Syncing Board Config Layers...</td>
              </tr>
            ) : dashboardConfigs.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-12 text-center text-xs font-bold text-zinc-400 italic select-none">דף הבית ריק ממדדים פומביים. הגדר תצוגה ראשונה למעלה.</td>
              </tr>
            ) : (
              [...dashboardConfigs]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(config => (
                  <tr key={config.id} className="group transition-all hover:bg-white/60">
                    <td className="px-6 py-4 text-center select-none">
                      <span className="bg-white text-zinc-700 font-mono text-xs px-2.5 py-1 rounded-md border border-zinc-100 font-black shadow-sm">
                        #{config.sort_order}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-zinc-900 text-sm">{config.title}</td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-600">{config.exercise_name}</td>
                    <td className="px-6 py-4 text-xs font-medium text-zinc-500">
                      {parameters.find(p => p.id === config.parameter_id)?.name || `Parameter ID: ${config.parameter_id}`}
                    </td>
                    <td className="px-6 py-4 select-none">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        config.display_type === 'leaderboard' ? 'bg-amber-500/5 text-amber-600 border-amber-500/10' :
                        config.display_type === 'chart' ? 'bg-blue-500/5 text-blue-600 border-blue-500/10' : 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10'
                      }`}>
                        {config.display_type === 'leaderboard' ? '🏆 LEADERBOARD' :
                         config.display_type === 'chart' ? '📈 CHART' : '💎 SUMMARY'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center justify-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 sm:translate-y-0 group-hover:translate-y-0 shrink-0">
                        <button type="button" onClick={() => startEdit(config)} className="w-9 h-9 flex items-center justify-center bg-white border border-zinc-100 text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all active:scale-90 shadow-sm" title="ערוך חוק תצוגה">✏️</button>
                        <button type="button" onClick={() => handleDelete(config.id)} className="w-9 h-9 flex items-center justify-center bg-rose-50 border border-rose-100 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-90 shadow-sm" title="מחק חוק תצוגה">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default DashboardConfig;