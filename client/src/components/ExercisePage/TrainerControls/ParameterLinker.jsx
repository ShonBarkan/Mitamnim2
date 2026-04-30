import React, { useState } from 'react';

const ParameterLinker = ({ parameters, onLinkParam, onCreateAndLink }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    aggregation_strategy: 'sum'
  });

  const handleAdd = (paramId) => {
    if (!paramId) return;
    onLinkParam(null, paramId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    // שליחת הנתונים לפונקציית היצירה ב-ExercisePage
    onCreateAndLink(formData);
    
    // איפוס הטופס
    setIsCreating(false);
    setFormData({ name: '', unit: '', aggregation_strategy: 'sum' });
  };

  return (
    <div style={{ padding: '15px', border: '1px dashed #007bff', borderRadius: '12px', backgroundColor: '#f0f7ff' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '15px' 
      }}>
        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔗 פרמטרים זמינים לקישור
        </h4>
        
        <button 
          onClick={() => setIsCreating(!isCreating)}
          style={{
            backgroundColor: isCreating ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isCreating ? 'ביטול' : '+ צור פרמטר חדש'}
        </button>
      </div>

      {/* טופס יצירה פנימי */}
      {isCreating && (
        <form 
          onSubmit={handleSubmit}
          style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '10px', 
            marginBottom: '20px', 
            border: '1px solid #28a745',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input 
              placeholder="שם הפרמטר (למשל: משקל)"
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <input 
              placeholder="יחידה (למשל: kg)"
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>אסטרטגיית אגרגציה (איך לחשב גרפים):</label>
            <select 
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: '#fff' }}
              value={formData.aggregation_strategy}
              onChange={(e) => setFormData({...formData, aggregation_strategy: e.target.value})}
            >
              <option value="sum">סיכום (Sum) - למשל: סה"כ חזרות</option>
              <option value="max">מקסימום (Max) - למשל: שיא משקל</option>
              <option value="avg">ממוצע (Avg)</option>
              <option value="latest">ערך אחרון (Latest) - למשל: דופק מנוחה</option>
            </select>
          </div>

          <button 
            type="submit"
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            שמור וקשר לתרגיל
          </button>
        </form>
      )}
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
        gap: '10px' 
      }}>
        
        {/* כרטיס יצירה מהירה */}
        {!isCreating && (
          <div 
            onClick={() => setIsCreating(true)}
            style={{
              backgroundColor: '#e9fbe9',
              border: '1px dashed #28a745',
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#155724' }}>פרמטר חדש</div>
            <div style={{ fontSize: '11px', color: '#28a745' }}>יצירה והוספה</div>
            <div style={{
              marginTop: '8px',
              backgroundColor: '#28a745',
              color: 'white',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              ★
            </div>
          </div>
        )}

        {/* רשימת הפרמטרים הקיימים */}
        {parameters.map(p => (
          <div 
            key={p.id}
            onClick={() => handleAdd(p.id)}
            style={{
              backgroundColor: 'white',
              border: '1px solid #d0e3ff',
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{p.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>({p.unit})</div>
            <div style={{
              marginTop: '8px',
              backgroundColor: '#007bff',
              color: 'white',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              +
            </div>
          </div>
        ))}
      </div>

      {parameters.length === 0 && !isCreating && (
        <p style={{ fontSize: '13px', color: '#666', fontStyle: 'italic', textAlign: 'center', marginTop: '15px' }}>
          אין פרמטרים נוספים לקישור. ניתן ליצור אחד חדש.
        </p>
      )}
    </div>
  );
};

export default ParameterLinker;