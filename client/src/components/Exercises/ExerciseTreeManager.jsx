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

  const handleSaveEdit = async (id) => {
    try {
      await editExercise(id, { name: editName, group_id: user.group_id });
      setEditingId(null);
    } catch (err) {
      alert("Error updating exercise");
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
          <div key={node.id} style={{ marginRight: depth === 0 ? '0' : '20px', borderRight: depth === 0 ? 'none' : '1px solid #ddd', paddingRight: '10px', marginTop: '5px' }}>
            <div 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '10px', background: '#f8f9fa', 
                padding: '8px 12px', borderRadius: '5px', cursor: 'pointer' 
              }}
              onClick={() => navigate(`/exercises/${node.id}`)}
            >
              {hasChildren && (
                <span onClick={(e) => toggleCollapse(node.id, e)} style={{ fontSize: '10px', width: '15px' }}>
                  {isCollapsed ? '▶' : '▼'}
                </span>
              )}
              {!hasChildren && <span style={{ width: '15px' }} />}

              {editingId === node.id ? (
                <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '5px' }}>
                  <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                  <button onClick={() => handleSaveEdit(node.id)}>💾</button>
                  <button onClick={() => setEditingId(null)}>✖</button>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: depth === 0 ? 'bold' : 'normal' }}>{node.name}</span>
                  
                  {isTrainer && (
                    <div onClick={e => e.stopPropagation()} style={{ fontSize: '12px' }}>
                      <button 
                        onClick={() => { setEditingId(node.id); setEditName(node.name); }} 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#007bff' }}
                      >
                        ערוך
                      </button>

                      {!node.has_params ? (
                        <button 
                          onClick={() => { 
                            setFormData({ ...formData, parent_id: node.id }); 
                            setIsAdding(true); 
                          }} 
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#28a745', marginRight: '5px' }}
                        >
                          + תת-תרגיל
                        </button>
                      ) : (
                        <span style={{ color: '#aaa', marginRight: '5px', fontStyle: 'italic' }}> (פרמטר) </span>
                      )}

                      <button 
                        onClick={() => { if(window.confirm('מחיקת התרגיל תמחוק גם בנים. להמשיך?')) removeExercise(node.id) }} 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc3545', marginRight: '5px' }}
                      >
                        מחק
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isCollapsed && renderTree(node.id, depth + 1)}
          </div>
        );
      });
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

  return (
    <div style={{ padding: '20px', direction: 'rtl', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>עץ תרגילים</h2>
        
        <input 
          type="text" 
          placeholder="חפש תרגיל..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', width: '250px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
      </div>

      {isTrainer && !isAdding && (
        <button 
          onClick={() => setIsAdding(true)} 
          style={{ marginBottom: '15px', padding: '8px 15px', cursor: 'pointer', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px' }}
        >
          + הוסף קטגוריית שורש
        </button>
      )}

      {isAdding && (
        <form onSubmit={handleAddSubmit} style={{ marginBottom: '15px', padding: '15px', background: '#e9ecef', borderRadius: '8px' }}>
          <span style={{ fontSize: '13px' }}>
            מוסיף ל: <strong>{formData.parent_id ? exercises.find(e => e.id === formData.parent_id)?.name : "שורש העץ"}</strong>
          </span>
          <div style={{ marginTop: '5px' }}>
            <input 
              placeholder="שם התרגיל/קטגוריה" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
              style={{ padding: '5px', width: '200px' }} 
            />
            <button type="submit" style={{ marginRight: '10px' }}>שמור</button>
            <button type="button" onClick={() => { setIsAdding(false); setFormData({name: '', parent_id: null}); }}>ביטול</button>
          </div>
        </form>
      )}

      {loading ? <p>טוען עץ...</p> : <div>{renderTree(null)}</div>}
    </div>
  );
};

export default ExerciseTreeManager;