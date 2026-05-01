import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExerciseContext } from '../../contexts/ExerciseContext';
import { useAuth } from '../../hooks/useAuth';

const ExerciseTreeManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { exercises, fetchExercises, addExercise, removeExercise, editExercise, loading } = useContext(ExerciseContext);

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', parent_id: null });
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedIds, setCollapsedIds] = useState(new Set());

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const visibleExerciseIds = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const matches = new Set();
    const lowerSearch = searchTerm.toLowerCase();

    const addAncestors = (exercise) => {
      if (exercise.parent_id) {
        const parent = exercises.find(e => e.id === exercise.parent_id);
        if (parent && !matches.has(parent.id)) {
          matches.add(parent.id);
          addAncestors(parent);
        }
      }
    };

    exercises.forEach(ex => {
      if (ex.name.toLowerCase().includes(lowerSearch)) {
        matches.add(ex.id);
        addAncestors(ex);
      }
    });
    return matches;
  }, [exercises, searchTerm]);

  const toggleCollapse = (id, e) => {
    e.stopPropagation();
    const newCollapsed = new Set(collapsedIds);
    if (newCollapsed.has(id)) {
      newCollapsed.delete(id);
    } else {
      newCollapsed.add(id);
    }
    setCollapsedIds(newCollapsed);
  };

  const expandAll = () => setCollapsedIds(new Set());
  const collapseAll = () => {
    const allIds = new Set(exercises.filter(ex => ex.has_children || exercises.some(e => e.parent_id === ex.id)).map(ex => ex.id));
    setCollapsedIds(allIds);
  };

  const handleSaveEdit = async (id) => {
    try {
      await editExercise(id, { name: editName, group_id: user.group_id });
      setEditingId(null);
    } catch (err) {
      alert("Error updating exercise");
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (formData.parent_id) {
      const parent = exercises.find(ex => ex.id === formData.parent_id);
      if (parent?.has_params) {
        alert("לא ניתן להוסיף תת-תרגיל לתרגיל עם פרמטרים.");
        return;
      }
    }
    try {
      await addExercise({ ...formData, group_id: user.group_id });
      setFormData({ name: '', parent_id: null });
      setIsAdding(false);
    } catch (err) {
      alert("Error adding exercise");
    }
  };

  const renderTree = (parentId = null, depth = 0) => {
    const children = exercises.filter(e => e.parent_id === parentId);

    return children
      .filter(node => !visibleExerciseIds || visibleExerciseIds.has(node.id))
      .map(node => {
        const isCollapsed = collapsedIds.has(node.id);
        const hasChildren = exercises.some(e => e.parent_id === node.id);

        return (
          <div key={node.id} className="relative">
            {depth > 0 && (
              <div className="absolute right-[-18px] top-0 bottom-0 w-px bg-zinc-100" style={{ right: '-16px' }} />
            )}
            
            <div 
              className={`group flex items-center gap-4 p-4 my-1.5 rounded-[1.5rem] transition-all border ${
                editingId === node.id 
                ? 'bg-blue-50 border-blue-200 shadow-sm' 
                : 'bg-white border-transparent hover:border-zinc-100 hover:shadow-xl hover:shadow-slate-200/40'
              }`}
              onClick={() => !editingId && navigate(`/exercises/${node.id}`)}
              style={{ cursor: editingId ? 'default' : 'pointer' }}
            >
              {hasChildren ? (
                <button 
                  onClick={(e) => toggleCollapse(node.id, e)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                    isCollapsed ? 'bg-zinc-100 text-zinc-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                  }`}
                >
                  <span className={`text-xs transition-transform duration-500 ${isCollapsed ? '' : 'rotate-180'}`}>▼</span>
                </button>
              ) : (
                <div className="w-10 h-10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-zinc-200" />
                </div>
              )}

              {editingId === node.id ? (
                <div onClick={e => e.stopPropagation()} className="flex-1 flex gap-2">
                  <input 
                    className="flex-1 bg-white border border-blue-300 rounded-xl px-4 py-2 outline-none font-bold"
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    autoFocus 
                  />
                  <button onClick={() => handleSaveEdit(node.id)} className="p-2 bg-blue-600 text-white rounded-xl">💾</button>
                  <button onClick={() => setEditingId(null)} className="p-2 bg-zinc-200 text-zinc-600 rounded-xl">✖</button>
                </div>
              ) : (
                <div className="flex-1 flex justify-between items-center">
                  <span className={`text-lg tracking-tight ${depth === 0 ? 'font-black text-zinc-900' : 'font-bold text-zinc-600'}`}>
                    {node.name}
                  </span>
                  
                  {isTrainer && (
                    <div onClick={e => e.stopPropagation()} className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingId(node.id); setEditName(node.name); }} 
                        className="px-3 py-1.5 text-xs font-black text-zinc-400 hover:text-blue-600 transition-colors bg-zinc-50 rounded-lg"
                      >
                        ערוך
                      </button>
                      {!node.has_params && (
                        <button 
                          onClick={() => { setFormData({ ...formData, parent_id: node.id }); setIsAdding(true); }} 
                          className="px-3 py-1.5 text-xs font-black text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 rounded-lg"
                        >
                          + תת-תרגיל
                        </button>
                      )}
                      <button 
                        onClick={() => { if(window.confirm('מחיקת התרגיל תמחוק גם בנים. להמשיך?')) removeExercise(node.id) }} 
                        className="px-3 py-1.5 text-xs font-black text-rose-400 hover:text-rose-600 transition-colors bg-rose-50 rounded-lg"
                      >
                        מחק
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={`mr-8 transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[3000px] opacity-100'}`}>
              {renderTree(node.id, depth + 1)}
            </div>
          </div>
        );
      });
  };

  return (
    <div className="max-w-5xl mx-auto mt-12 p-10 bg-white border border-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] rounded-[3.5rem] font-sans" dir="rtl">
      
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-5xl font-black text-zinc-900 tracking-tighter">ניהול תרגילים</h2>
            {isTrainer && !isAdding && (
              <button 
                onClick={() => setIsAdding(true)} 
                className="bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
              >
                + קטגוריית שורש
              </button>
            )}
          </div>
          <div className="flex gap-2">
             <button onClick={expandAll} className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all">פתח הכל</button>
             <button onClick={collapseAll} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 px-4 py-2 rounded-xl hover:bg-zinc-100 transition-all">סגור הכל</button>
          </div>
        </div>
        
        <div className="relative w-full lg:w-96 group">
          <input 
            type="text" 
            placeholder="חפש תרגיל..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-zinc-100 rounded-[1.5rem] px-6 py-5 text-base font-bold text-zinc-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all placeholder:text-zinc-300"
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none">🔍</span>
        </div>
      </header>

      {/* Creation Form (Trainer Only) */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="mb-12 p-8 bg-zinc-900 rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-500 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                הוספה ל: {formData.parent_id ? exercises.find(e => e.id === formData.parent_id)?.name : "שורש העץ"}
              </span>
              <button type="button" onClick={() => { setIsAdding(false); setFormData({name: '', parent_id: null}); }} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors">✕</button>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                placeholder="שם התרגיל או הקטגוריה..." 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 transition-all text-white placeholder:text-zinc-600 text-lg font-bold"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-500/20 active:scale-95">שמור שינויים</button>
            </div>
          </div>
        </form>
      )}

      {/* Tree Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p className="mt-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em]">Loading Exercises</p>
          </div>
        ) : (
          <div className="space-y-1">
            {renderTree(null)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseTreeManager;