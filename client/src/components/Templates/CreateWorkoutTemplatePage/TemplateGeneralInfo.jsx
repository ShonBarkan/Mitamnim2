import React from 'react';

const TemplateGeneralInfo = ({ formData, setFormData, categoryOptions, styles }) => {
  return (
    <section style={styles.section}>
      <h3 style={styles.title}>📝 פרטים כלליים</h3>
      <input 
        type="text" placeholder="שם האימון"
        value={formData.name} 
        onChange={e => setFormData({...formData, name: e.target.value})}
        style={styles.input} required
      />
      <textarea 
        placeholder="תיאור קצר (מטרת האימון, דגשים...)"
        value={formData.description} 
        onChange={e => setFormData({...formData, description: e.target.value})}
        style={{...styles.input, height: '60px', resize: 'none'}}
      />
      
      <label style={styles.label}>בחר קטגוריית אב לאימון:</label>
      <select 
        value={formData.parent_exercise_id} 
        onChange={e => setFormData({...formData, parent_exercise_id: e.target.value, exercises_config: []})}
        style={styles.input}
        required
      >
        <option value="">-- בחר קטגוריה (כולל תתי-קטגוריות) --</option>
        {categoryOptions.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.name}</option>
        ))}
      </select>
      <p style={{ fontSize: '12px', color: '#666' }}>* שינוי קטגוריה ינקה את רשימת התרגילים הנוכחית.</p>
    </section>
  );
};

export default TemplateGeneralInfo;