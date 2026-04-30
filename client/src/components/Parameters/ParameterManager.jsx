import React, { useContext, useEffect, useState } from 'react';
import { ParameterContext } from '../../contexts/ParameterContext';
import { useAuth } from '../../hooks/useAuth';
import { useStats } from '../../contexts/StatsContext';
import StatsSettingsGroup from './StatsSettingsGroup';

const ParameterManager = () => {
  const { user } = useAuth();
  const { parameters, fetchParameters, addParameter, removeParameter, editParameter, loading } = useContext(ParameterContext);
  const { refreshAllConfigs } = useStats(); 
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', unit: '', aggregation_strategy: 'sum' });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', unit: '', aggregation_strategy: 'sum' });

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  // Available strategies for the dropdown
  const strategies = [
    { id: 'sum', label: 'סכימה (Sum)' },
    { id: 'max', label: 'שיא / PR (Max)' },
    { id: 'min', label: 'מינימום / זמן (Min)' },
    { id: 'avg', label: 'ממוצע (Avg)' },
    { id: 'latest', label: 'ערך אחרון (Latest)' },
  ];

  useEffect(() => {
    fetchParameters();
    refreshAllConfigs(); 
  }, [fetchParameters, refreshAllConfigs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.group_id) {
      alert("Error: User group ID not found");
      return;
    }

    try {
      await addParameter({ 
        ...formData, 
        group_id: user.group_id 
      });
      setFormData({ name: '', unit: '', aggregation_strategy: 'sum' });
      setIsAdding(false);
    } catch (err) {
      alert("Error adding parameter");
    }
  };

  const handleStartEdit = (param) => {
    setEditingId(param.id);
    setEditData({ 
        name: param.name, 
        unit: param.unit, 
        aggregation_strategy: param.aggregation_strategy || 'sum' 
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      await editParameter(id, { 
        ...editData, 
        group_id: user.group_id 
      });
      setEditingId(null);
    } catch (err) {
      alert("Error updating parameter");
    }
  };

  return (
    <div style={{ padding: '20px', direction: 'rtl', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ddd' }}>
      <h2 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>פרמטרים למדידה</h2>

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
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input 
              placeholder="שם הפרמטר (למשל: משקל)" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required 
              style={{ padding: '8px', flex: 1 }}
            />
            <input 
              placeholder="יחידת מידה (למשל: ק״ג)" 
              value={formData.unit}
              onChange={e => setFormData({...formData, unit: e.target.value})}
              required 
              style={{ padding: '8px', width: '120px' }}
            />
            <select 
              value={formData.aggregation_strategy}
              onChange={e => setFormData({...formData, aggregation_strategy: e.target.value})}
              style={{ padding: '8px', borderRadius: '4px' }}
            >
              {strategies.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <button type="submit" style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px' }}>שמור</button>
            <button type="button" onClick={() => setIsAdding(false)} style={{ padding: '8px 15px', cursor: 'pointer', background: '#eee', border: 'none', borderRadius: '4px' }}>ביטול</button>
          </div>
        </form>
      )}

      {loading ? <p>טוען נתונים...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', color: '#666' }}>
              <th style={{ padding: '12px' }}>שם הפרמטר</th>
              <th style={{ padding: '12px' }}>יחידת מידה</th>
              <th style={{ padding: '12px' }}>אסטרטגיית אגרגציה</th>
              {isTrainer && <th style={{ padding: '12px' }}>פעולות</th>}
            </tr>
          </thead>
          <tbody>
            {parameters.map(param => (
              <tr key={param.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                {editingId === param.id ? (
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
                      <select 
                        value={editData.aggregation_strategy}
                        onChange={e => setEditData({...editData, aggregation_strategy: e.target.value})}
                        style={{ padding: '5px', width: '100%' }}
                      >
                        {strategies.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => handleSaveEdit(param.id)} style={{ color: 'green', marginLeft: '10px', cursor: 'pointer', border: 'none', background: 'none' }}>💾 שמור</button>
                      <button onClick={() => setEditingId(null)} style={{ color: '#666', cursor: 'pointer', border: 'none', background: 'none' }}>ביטול</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '12px' }}>{param.name}</td>
                    <td style={{ padding: '12px' }}>{param.unit}</td>
                    <td style={{ padding: '12px', fontSize: '0.9em', color: '#555' }}>
                        {strategies.find(s => s.id === param.aggregation_strategy)?.label || param.aggregation_strategy}
                    </td>
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

      {isTrainer && <StatsSettingsGroup />}
    </div>
  );
};

export default ParameterManager;