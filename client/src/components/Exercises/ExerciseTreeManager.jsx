import React, { useContext, useEffect, useState } from 'react';
import { ExerciseContext } from '../../contexts/ExerciseContext';
import { useAuth } from '../../hooks/useAuth';

const ExerciseTreeManager = () => {
  const { user } = useAuth();
  const { exercises, fetchExercises, addExercise, removeExercise, editExercise, loading } = useContext(ExerciseContext);
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', parent_id: null });
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const handleSaveEdit = async (id) => {
    try {
      await editExercise(id, { 
        name: editName,
        group_id: user.group_id 
      });
      setEditingId(null);
    } catch (err) {
      alert("Error updating exercise");
    }
  };

  const renderTree = (parentId = null, depth = 0) => {
    return exercises
      .filter(e => e.parent_id === parentId)
      .map(node => (
        <div key={node.id} style={{ marginRight: `${depth * 20}px`, borderRight: '1px solid #ddd', paddingRight: '10px', marginTop: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8f9fa', padding: '5px 10px', borderRadius: '5px' }}>
            {editingId === node.id ? (
              <>
                <input 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  style={{ padding: '2px' }} 
                />
                <button onClick={() => handleSaveEdit(node.id)}>💾</button>
                <button onClick={() => setEditingId(null)}>✖</button>
              </>
            ) : (
              <>
                <span style={{ fontWeight: depth === 0 ? 'bold' : 'normal' }}>{node.name}</span>
                {isTrainer && (
                  <div style={{ fontSize: '12px' }}>
                    <button 
                      onClick={() => { setEditingId(node.id); setEditName(node.name); }} 
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#007bff' }}
                    >
                      ערוך
                    </button>

                    {/* NEW LOGIC: Only show '+ Sub-exercise' if the node has NO parameters */}
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
                      <span style={{ color: '#aaa', marginRight: '5px', fontStyle: 'italic' }} title="תרגיל עם פרמטרים לא יכול להכיל בנים">
                        (יש פרמטר)
                      </span>
                    )}

                    <button 
                      onClick={() => { if(window.confirm('מחיקת התרגיל תמחוק גם את כל תתי-התרגילים. להמשיך?')) removeExercise(node.id) }} 
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc3545', marginRight: '5px' }}
                    >
                      מחק
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          {renderTree(node.id, depth + 1)}
        </div>
      ));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!user?.group_id) {
      alert("Error: Missing group ID");
      return;
    }

    // Safety check: find parent node in state to verify it still has no params
    if (formData.parent_id) {
      const parent = exercises.find(ex => ex.id === formData.parent_id);
      if (parent?.has_params) {
        alert("לא ניתן להוסיף תת-תרגיל לתרגיל שכבר הוגדרו לו פרמטרים.");
        return;
      }
    }

    try {
      await addExercise({ 
        ...formData, 
        group_id: user.group_id 
      });
      setFormData({ name: '', parent_id: null });
      setIsAdding(false);
    } catch (err) {
      alert("Error adding exercise");
    }
  };

  return (
    <div style={{ padding: '20px', direction: 'rtl', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ddd', marginTop: '20px' }}>
      <h2 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>עץ תרגילים</h2>

      {isTrainer && !isAdding && (
        <button 
          onClick={() => setIsAdding(true)} 
          style={{ marginBottom: '15px', padding: '8px 15px', cursor: 'pointer' }}
        >
          + הוסף קטגוריית שורש
        </button>
      )}

      {isAdding && (
        <form onSubmit={handleAddSubmit} style={{ marginBottom: '15px', padding: '10px', background: '#e9ecef', borderRadius: '8px' }}>
          <span style={{ fontSize: '13px' }}>
            מוסיף ל: <strong>{formData.parent_id ? exercises.find(e => e.id === formData.parent_id)?.name : "שורש העץ"}</strong>
          </span>
          <br />
          <input 
            placeholder="שם התרגיל/קטגוריה" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required 
            style={{ padding: '5px', marginTop: '5px', width: '200px' }} 
          />
          <button type="submit" style={{ marginRight: '10px' }}>שמור</button>
          <button type="button" onClick={() => { setIsAdding(false); setFormData({name: '', parent_id: null}); }}>ביטול</button>
        </form>
      )}

      {loading ? <p>טוען עץ...</p> : <div>{renderTree(null)}</div>}
    </div>
  );
};

export default ExerciseTreeManager;