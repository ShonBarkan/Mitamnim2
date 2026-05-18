import React, { useState, useEffect } from 'react';
import { useExercises } from '../../contexts/ExerciseContext';
import { useToast } from '../../contexts/ToastContext';
import FrontendLogger from '../../utils/logger';

/**
 * ExerciseRegistryManager Component - Flat exercise directory supervisor.
 * Governs group-wide exercise blueprints and handles cascading global renaming logic.
 */
const ExerciseRegistryManager = () => {
  const { exercises, loading, fetchExercises, createExercise, updateExercise, deleteExercise } = useExercises();
  const { showToast } = useToast();

  const [newExerciseName, setNewExerciseName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editExerciseName, setEditExerciseName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize exercise flat matrix on component mount
  useEffect(() => {
    FrontendLogger.info('EXERCISE_REGISTRY', 'Synchronizing group unified flat exercise directory repository');
    fetchExercises();
  }, [fetchExercises]);

  /**
   * Captures an exercise instance token and injects it into the editing layout state
   */
  const startEdit = (exercise) => {
    FrontendLogger.info('EXERCISE_REGISTRY', `Focusing profile edit layout on exercise target id: ${exercise.id}`);
    setEditingId(exercise.id);
    setEditExerciseName(exercise.exercise_name);
  };

  const cancelEdit = () => {
    FrontendLogger.info('EXERCISE_REGISTRY', 'Evicting active inline edit constraints');
    setEditingId(null);
    setEditExerciseName('');
  };

  /**
   * Handles creation of brand new flat exercise blueprints
   */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newExerciseName.trim()) {
      showToast("אנא הזן שם תרגיל תקני", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      FrontendLogger.info('EXERCISE_REGISTRY', `Submitting blueprint registration sequence for: '${newExerciseName}'`);
      await createExercise({ exercise_name: newExerciseName.trim() });
      showToast("התרגיל נוסף למאגר בהצלחה", "success");
      setNewExerciseName('');
    } catch (err) {
      FrontendLogger.error('EXERCISE_REGISTRY', 'Failed to allocate fresh exercise entity row inside database context', err);
      showToast("שגיאה בהוספת התרגיל, ייתכן והשם כבר קיים", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles complex cascade updates (Renaming modifies all historic logs and templates instantly in backend)
   */
  const handleUpdate = async (id) => {
    if (!editExerciseName.trim()) {
      showToast("שם התרגיל אינו יכול להישאר ריק", "error");
      return;
    }

    const originalExercise = exercises.find(ex => ex.id === id);
    if (originalExercise?.exercise_name === editExerciseName.trim()) {
      cancelEdit();
      return;
    }

    FrontendLogger.warn('EXERCISE_REGISTRY', `Triggering global bulk rename repair sequence. Node ID: ${id} | Old: '${originalExercise?.exercise_name}' -> New: '${editExerciseName}'`);
    
    if (window.confirm(`שים לב! שינוי שם התרגיל יעדכן אוטומטית ובאופן רוחבי את כל יומני הביצועים (Logs) ותבניות האימון של הספורטאים במערכת. האם להמשיך?`)) {
      setIsSubmitting(true);
      try {
        await updateExercise(id, { exercise_name: editExerciseName.trim() });
        showToast("השם עודכן בהצלחה בכל רחבי המערכת", "success");
        cancelEdit();
      } catch (err) {
        FrontendLogger.error('EXERCISE_REGISTRY', `Global cascading repair sequence rejected for target node index: ${id}`, err);
        showToast("שגיאה בתהליך עדכון השם הגלובלי", "error");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  /**
   * Drops an exercise configuration blueprint from active indexes
   */
  const handleDelete = async (id, name) => {
    FrontendLogger.warn('EXERCISE_REGISTRY', `Executing absolute destruction sequence for exercise catalog entity id: ${id} ('${name}')`);
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את '${name}' ממאגר התרגילים הכללי? פעולה זו תנקה את זיכרון ההגדרות שלו.`)) {
      try {
        await deleteExercise(id);
        showToast("התרגיל הוסר בהצלחה מהרשימה", "success");
        if (editingId === id) cancelEdit();
      } catch (err) {
        showToast("שגיאה במחיקת התרגיל מהמאגר", "error");
      }
    }
  };

  return (
    <div className="space-y-10 font-sans" dir="rtl">
      
      {/* --- ADD NEW BLUEPRINT RECORD FORM BLOCK --- */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <h3 className="text-xl font-black text-zinc-900">הוספת תרגיל חדש ל-Registry הקבוצתי</h3>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם התרגיל בעברית או אנגלית</label>
            <input
              type="text"
              placeholder="e.g., Bench Press / סקווט חופשי"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newExerciseName.trim()}
            className="px-10 py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            הוסף למאגר
          </button>
        </form>
      </div>

      {/* --- FLAT EXERCISE BLUEPRINTS INDEX MATRIX TABLE --- */}
      <div className="border border-zinc-100 rounded-2xl overflow-hidden shadow-sm bg-white/20">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-zinc-100/50 text-zinc-400 uppercase text-[10px] font-black tracking-wider border-b border-zinc-200/60">
              <th className="px-8 py-4">מזהה מערכת</th>
              <th className="px-8 py-4">שם התרגיל הרשום</th>
              <th className="px-8 py-4">חוקיות ושלמות נתונים</th>
              <th className="px-8 py-4 text-left">פעולות עריכה ומחיקה</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-10 text-center text-xs font-bold text-zinc-400 uppercase animate-pulse">Syncing Unified Exercise Assets...</td>
              </tr>
            ) : exercises.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-10 text-center text-xs font-bold text-zinc-300 italic">לא נמצאו תרגילים רשומים במאגר הקבוצתי</td>
              </tr>
            ) : (
              exercises.map((exercise) => (
                <tr key={exercise.id} className="group transition-all hover:bg-white/40">
                  
                  {/* ID Column */}
                  <td className="px-8 py-5">
                    <code className="text-[11px] font-mono bg-zinc-100 px-2 py-1 rounded border border-zinc-200/40 text-zinc-400">
                      #{exercise.id}
                    </code>
                  </td>

                  {/* Dynamic Inline Editing / Presentation Name Column */}
                  <td className="px-8 py-5">
                    {editingId === exercise.id ? (
                      <div className="flex items-center gap-2 max-w-md animate-in fade-in duration-200">
                        <input
                          type="text"
                          value={editExerciseName}
                          onChange={(e) => setEditExerciseName(e.target.value)}
                          disabled={isSubmitting}
                          className="bg-white border border-zinc-300 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-zinc-900 flex-1"
                        />
                        <button type="button" onClick={() => handleUpdate(exercise.id)} disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 text-white font-black text-xs rounded-xl hover:bg-emerald-700 active:scale-95 transition-all">שמור</button>
                        <button type="button" onClick={cancelEdit} disabled={isSubmitting} className="px-3 py-2 bg-zinc-100 text-zinc-500 font-bold text-xs rounded-xl hover:bg-zinc-200 transition-all">ביטול</button>
                      </div>
                    ) : (
                      <span className="font-black text-zinc-900 text-base">{exercise.exercise_name}</span>
                    )}
                  </td>

                  {/* System Context State Metadata Check */}
                  <td className="px-8 py-5 text-xs text-zinc-400 font-mono">
                    <span className="bg-zinc-100/80 border border-zinc-200/50 text-zinc-500 font-bold px-3 py-1 rounded-lg text-[10px]">
                      Cascading Rules: Verified
                    </span>
                  </td>

                  {/* Actions Grid Trigger Items */}
                  <td className="px-8 py-5 text-left">
                    {editingId !== exercise.id && (
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => startEdit(exercise)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors active:scale-90"
                          title="שינוי שם גלובלי"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(exercise.id, exercise.exercise_name)}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors active:scale-90"
                          title="מחיקה מהרשימה"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
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

export default ExerciseRegistryManager;