import React, { useState, useEffect, useContext, useMemo } from 'react';
import { ExerciseContext } from '../../contexts/ExerciseContext';
import { ParameterContext } from '../../contexts/ParameterContext';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

/**
 * ExerciseRegistryManager Component - Flat registry for exercise definitions.
 * Replaces the old Tree architecture. Allows linking exercises to measurement parameters.
 */
const ExerciseRegistryManager = () => {
  const { user } = useAuth();
  const { exercises, fetchExercises, addExercise, removeExercise, editExercise, loading } = useContext(ExerciseContext);
  const { parameters } = useContext(ParameterContext);
  const { showToast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);

  const initialFormState = { name: '', category: '', active_parameter_ids: [] };
  const [formData, setFormData] = useState(initialFormState);

  const isAuthorized = user?.role === 'trainer' || user?.role === 'admin';

  useEffect(() => {
    fetchExercises();
  }, []);

  /**
   * Filters the registry based on search term (Name or Category).
   */
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [exercises, searchTerm]);

  const handleStartEdit = (ex) => {
    setEditingId(ex.id);
    setFormData({
      name: ex.name,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, group_id: user.group_id };
      if (editingId) {
        await editExercise(editingId, payload);
        showToast("התרגיל עודכן בהצלחה", "success");
      } else {
        await addExercise(payload);
        showToast("תרגיל חדש נוסף לרישום", "success");
      }
      cancelForm();
    } catch (err) {
      showToast("שגיאה בשמירת התרגיל", "error");
    }
  };

  const toggleParameter = (paramId) => {
    setFormData(prev => {
      const ids = prev.active_parameter_ids.includes(paramId)
        ? prev.active_parameter_ids.filter(id => id !== paramId)
        : [...prev.active_parameter_ids, paramId];
      return { ...prev, active_parameter_ids: ids };
    });
  };

  return (
    <div className="space-y-8 font-sans" dir="rtl">
      
      {/* Search & Add Header */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="חיפוש תרגיל או קטגוריה..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/50 border border-white/60 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20">🔍</span>
        </div>
        
        {isAuthorized && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            ＋ תרגיל חדש
          </button>
        )}
      </div>

      {/* Editor Form (Arctic Mirror Style) */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/60 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">
              {editingId ? 'עריכת הגדרות תרגיל' : 'רישום תרגיל חדש'}
            </h3>
            <button type="button" onClick={cancelForm} className="text-zinc-400 hover:text-zinc-900 transition-colors">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם התרגיל</label>
              <input 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white border border-zinc-100 rounded-xl px-5 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">קטגוריה (תגית)</label>
              <input 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-white border border-zinc-100 rounded-xl px-5 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5"
                placeholder="e.g., ג'ודו, כוח, אירובי"
              />
            </div>
          </div>

          {/* Parameter Linking Section */}
          <div className="space-y-4 mb-8">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שיוך פרמטרים למדידה (רק פרמטרים רגילים):</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-4 bg-white/20 rounded-2xl border border-white/40 scrollbar-hide">
              {parameters.filter(p => !p.is_virtual).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleParameter(p.id)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                    formData.active_parameter_ids.includes(p.id)
                    ? 'bg-zinc-900 text-white shadow-lg'
                    : 'bg-white/60 text-zinc-400 hover:bg-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button type="submit" className="flex-1 bg-zinc-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95">
              שמור ברישום
            </button>
            <button type="button" onClick={cancelForm} className="px-8 bg-white/60 text-zinc-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-white/80">
              ביטול
            </button>
          </div>
        </form>
      )}

      {/* Registry List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center text-zinc-400 font-bold uppercase tracking-[0.3em] text-[10px]">Syncing Registry...</div>
        ) : (
          filteredExercises.map(ex => (
            <div key={ex.id} className="group bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-[2rem] flex justify-between items-center hover:bg-white/60 transition-all duration-500 hover:shadow-xl">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-zinc-900 tracking-tighter uppercase">{ex.name}</span>
                  {ex.category && (
                    <span className="bg-blue-600/10 text-blue-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      {ex.category}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Metrics: {ex.active_parameter_ids?.length || 0} Defined
                </div>
              </div>

              {isAuthorized && (
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleStartEdit(ex)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all">✏️</button>
                  <button onClick={() => { if(window.confirm('למחוק את התרגיל?')) removeExercise(ex.id) }} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all">🗑</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExerciseRegistryManager;