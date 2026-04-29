import React, { useContext, useEffect, useState } from 'react';
import { ParameterContext } from '../../contexts/ParameterContext';
import { useAuth } from '../../hooks/useAuth';

const ParameterManager = () => {
  const { user } = useAuth();
  const { parameters, fetchParameters, addParameter, removeParameter, editParameter, loading } = useContext(ParameterContext);
  
  // State for adding a new parameter
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', unit: '' });

  // State for editing an existing parameter
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', unit: '' });

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  useEffect(() => {
    fetchParameters();
  }, [fetchParameters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.group_id) {
      alert("שגיאה: לא נמצא מזהה קבוצה למשתמש");
      return;
    }

    try {
      // Inject the trainer's group_id into the request body
      await addParameter({ 
        ...formData, 
        group_id: user.group_id 
      });
      setFormData({ name: '', unit: '' });
      setIsAdding(false);
    } catch (err) {
      alert("שגיאה בהוספת פרמטר");
    }
  };

  const handleStartEdit = (param) => {
    setEditingId(param.id);
    setEditData({ name: param.name, unit: param.unit });
  };

  const handleSaveEdit = async (id) => {
    try {
      // We pass the name, unit and group_id to satisfy the backend schema requirements
      await editParameter(id, { 
        ...editData, 
        group_id: user.group_id 
      });
      setEditingId(null);
    } catch (err) {
      alert("שגיאה בעדכון הפרמטר");
    }
  };

  return (
    <div style={{ padding: '20px', direction: 'rtl', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ddd' }}>
      <h2 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>פרמטרים למדידה</h2>

      {/* Admin/Trainer View: Add New Parameter */}
      {isTrainer && !isAdding && (
        <button 
          onClick={() => setIsAdding(true)} 
          style={{ marginBottom: '20px', padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          + הוסף פרמטר חדש
        </button>
      )}

      {isAdding && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #28a745', borderRadius: '8px', backgroundColor: '#f9fff9' }}>
          <h4 style={{ marginTop: 0 }}>הוספת פרמטר חדש</h4>
          <input 
            placeholder="שם הפרמטר (למשל: משקל)" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required 
            style={{ marginLeft: '10px', padding: '8px' }}
          />
          <input 
            placeholder="יחידת מידה (למשל: ק״ג)" 
            value={formData.unit}
            onChange={e => setFormData({...formData, unit: e.target.value})}
            required 
            style={{ marginLeft: '10px', padding: '8px' }}
          />
          <button type="submit" style={{ padding: '8px 15px', cursor: 'pointer' }}>שמור</button>
          <button type="button" onClick={() => setIsAdding(false)} style={{ marginRight: '5px', padding: '8px 15px', cursor: 'pointer' }}>ביטול</button>
        </form>
      )}

      {/* Shared View: Parameter List */}
      {loading ? <p>טוען נתונים...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', color: '#666' }}>
              <th style={{ padding: '12px' }}>שם הפרמטר</th>
              <th style={{ padding: '12px' }}>יחידת מידה</th>
              {isTrainer && <th style={{ padding: '12px' }}>פעולות</th>}
            </tr>
          </thead>
          <tbody>
            {parameters.map(param => (
              <tr key={param.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                {editingId === param.id ? (
                  /* Edit Mode Row */
                  <>
                    <td style={{ padding: '10px' }}>
                      <input 
                        value={editData.name} 
                        onChange={e => setEditData({...editData, name: e.target.value})}
                        style={{ padding: '5px', width: '90%' }}
                      />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <input 
                        value={editData.unit} 
                        onChange={e => setEditData({...editData, unit: e.target.value})}
                        style={{ padding: '5px', width: '90%' }}
                      />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => handleSaveEdit(param.id)} style={{ color: 'green', marginLeft: '10px', cursor: 'pointer' }}>💾 שמור</button>
                      <button onClick={() => setEditingId(null)} style={{ color: '#666', cursor: 'pointer' }}>ביטול</button>
                    </td>
                  </>
                ) : (
                  /* Standard Mode Row */
                  <>
                    <td style={{ padding: '12px' }}>{param.name}</td>
                    <td style={{ padding: '12px' }}>{param.unit}</td>
                    {isTrainer && (
                      <td style={{ padding: '12px' }}>
                        <button 
                          onClick={() => handleStartEdit(param)} 
                          style={{ color: '#007bff', border: 'none', background: 'none', cursor: 'pointer', marginLeft: '15px' }}
                        >
                          ערוך ✎
                        </button>
                        <button 
                          onClick={() => { if(window.confirm('למחוק את הפרמטר?')) removeParameter(param.id) }} 
                          style={{ color: '#dc3545', border: 'none', background: 'none', cursor: 'pointer' }}
                        >
                          מחק 🗑
                        </button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ParameterManager;