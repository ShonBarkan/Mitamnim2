import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ExerciseContext } from '../contexts/ExerciseContext';
import { ParameterContext } from '../contexts/ParameterContext';
import { ActiveParamContext } from '../contexts/ActiveParamContext';
import { useToast } from '../hooks/useToast';

import ActivityJournal from '../components/Activity/ActivityJournal';
import ActivityCreator from '../components/Activity/ActivityCreator';

const ExercisePage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Contexts
  const { exercises, fetchExercises, addExercise } = useContext(ExerciseContext);
  const { parameters, fetchParameters } = useContext(ParameterContext);
  const { activeParams, fetchActiveParams, linkParam, unlinkParam, loading: paramsLoading } = useContext(ActiveParamContext);

  // Local State
  const [selectedEx, setSelectedEx] = useState(null);
  const [newSubExName, setNewSubExName] = useState('');
  const [selectedParamId, setSelectedParamId] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  
  // Modal State for adding new log
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  const hasSubExercises = selectedEx ? exercises.some(ex => ex.parent_id === selectedEx.id) : false;
  const hasParameters = activeParams.length > 0;

  useEffect(() => {
    fetchExercises();
    fetchParameters();
  }, [fetchExercises, fetchParameters]);

  useEffect(() => {
    if (selectedEx) {
      fetchActiveParams(selectedEx.id);
    }
  }, [selectedEx, fetchActiveParams]);

  // --- Handlers ---

  const handleAddSubExercise = async (e) => {
    e.preventDefault();
    if (!newSubExName.trim()) return;
    if (hasParameters) {
      showToast("Error: Cannot add sub-exercises to exercise with parameters", "error");
      return;
    }
    try {
      await addExercise({
        name: newSubExName,
        parent_id: selectedEx.id,
        group_id: user.group_id
      });
      setNewSubExName('');
      showToast("Sub-exercise added", "success");
    } catch (err) {
      showToast("Failed to add sub-exercise", "error");
    }
  };

  const handleLinkParam = async (e) => {
    e.preventDefault();
    if (!selectedParamId) return;
    if (hasSubExercises) {
      showToast("Error: Cannot add parameters to exercise with sub-exercises", "error");
      return;
    }
    try {
      await linkParam({
        exercise_id: selectedEx.id,
        parameter_id: parseInt(selectedParamId),
        group_id: user.group_id,
        default_value: defaultValue
      });
      setSelectedParamId('');
      setDefaultValue('');
      showToast("Parameter linked", "success");
    } catch (err) {
      showToast("Failed to link parameter", "error");
    }
  };

  // --- Render Tree ---
  const renderTree = (parentId = null, depth = 0) => {
    return exercises
      .filter(ex => ex.parent_id === parentId)
      .map(ex => (
        <div key={ex.id} style={{ marginRight: depth > 0 ? '20px' : '0', borderRight: depth > 0 ? '1px solid #eee' : 'none' }}>
          <div 
            onClick={() => setSelectedEx(ex)}
            style={{ 
              padding: '8px 12px', 
              cursor: 'pointer', 
              backgroundColor: selectedEx?.id === ex.id ? '#e3f2fd' : 'transparent',
              borderRadius: '6px',
              transition: '0.2s',
              fontWeight: depth === 0 ? 'bold' : 'normal',
              marginBottom: '4px'
            }}
          >
            {depth > 0 ? '└ ' : ''}{ex.name}
          </div>
          {renderTree(ex.id, depth + 1)}
        </div>
      ));
  };

  return (
    <div style={{ direction: 'rtl', padding: '20px', display: 'flex', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* SIDEBAR: Exercise Tree View */}
      <aside style={{ flex: '0 0 300px', borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
        <h3>עץ תרגילים</h3>
        <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {exercises.length > 0 ? renderTree(null) : <p>אין תרגילים בקבוצה</p>}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1 }}>
        {selectedEx ? (
          <div>
            <header style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>{selectedEx.name}</h2>
                <small style={{ color: '#666' }}>מזהה תרגיל: {selectedEx.id}</small>
              </div>
              
              {/* Floating Action Button for adding logs - only if leaf node with params */}
              {selectedEx && (
                <button 
                  onClick={() => setIsAddLogOpen(true)}
                  style={{
                    backgroundColor: '#28a745', color: 'white', border: 'none', 
                    padding: '10px 20px', borderRadius: '30px', cursor: 'pointer',
                    fontWeight: 'bold', boxShadow: '0 4px 10px rgba(40, 167, 69, 0.3)'
                  }}
                >
                  + תיעוד אימון חדש
                </button>
              )}
            </header>

            {/* Section 1: Linked Parameters */}
            <section style={{ marginBottom: '30px' }}>
              <h4 style={{ color: '#495057' }}>📊 פרמטרים פעילים</h4>
              {paramsLoading ? <p>טוען פרמטרים...</p> : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {activeParams.length > 0 ? activeParams.map(ap => (
                    <div key={ap.id} style={{ 
                      background: '#f8f9fa', padding: '8px 15px', borderRadius: '20px', 
                      border: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'
                    }}>
                      <strong>{ap.parameter_name}</strong> 
                      <span style={{ color: '#666' }}>({ap.parameter_unit})</span>
                      {isTrainer && (
                        <button onClick={() => unlinkParam(ap.id)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}>✕</button>
                      )}
                    </div>
                  )) : <p style={{ fontSize: '14px', color: '#999' }}>אין פרמטרים (קטגוריה).</p>}
                </div>
              )}
            </section>

            {/* Section 2: Activity History (The Journal) */}
            <section style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <ActivityJournal exerciseId={selectedEx.id} />
            </section>

            {/* Trainer Controls Modal-style layout */}
            {isTrainer && (
              <div style={{ 
                marginTop: '40px', display: 'grid', gridTemplateColumns: (!hasParameters && !hasSubExercises) ? '1fr 1fr' : '1fr', 
                gap: '20px', background: '#f8f9fa', padding: '20px', borderRadius: '12px'
              }}>
                {!hasSubExercises && (
                  <div style={{ padding: '10px', border: '1px dashed #007bff', borderRadius: '8px' }}>
                    <h4>🔗 הוספת פרמטר</h4>
                    <form onSubmit={handleLinkParam} style={{ display: 'flex', gap: '10px' }}>
                      <select value={selectedParamId} onChange={e => setSelectedParamId(e.target.value)} required style={{ flex: 1, padding: '8px' }}>
                        <option value="">-- בחר --</option>
                        {parameters.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>הוסף</button>
                    </form>
                  </div>
                )}
                {!hasParameters && (
                  <div style={{ padding: '10px', border: '1px dashed #28a745', borderRadius: '8px' }}>
                    <h4>🌱 הוספת תת-תרגיל</h4>
                    <form onSubmit={handleAddSubExercise} style={{ display: 'flex', gap: '10px' }}>
                      <input type="text" placeholder="שם התרגיל" value={newSubExName} onChange={e => setNewSubExName(e.target.value)} required style={{ flex: 1, padding: '8px' }} />
                      <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>צור</button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#999' }}>
            <h2>בחר תרגיל מהעץ לצפייה בהיסטוריה</h2>
          </div>
        )}
      </main>

      {/* --- ADD LOG MODAL --- */}
      {isAddLogOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{ width: '90%', maxWidth: '500px', position: 'relative' }}>
            <button 
              onClick={() => setIsAddLogOpen(false)}
              style={{
                position: 'absolute', top: '-40px', left: '0', 
                background: 'none', border: 'none', color: 'white', 
                fontSize: '24px', cursor: 'pointer'
              }}
            >
              ✕ סגור
            </button>
            <ActivityCreator 
              initialExercise={selectedEx} 
              onComplete={() => setIsAddLogOpen(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExercisePage;