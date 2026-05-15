import React from 'react';

const TemplateGeneralInfo = ({ formData, setFormData, categoryOptions }) => {
  return (
    <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 m-0">
        <span className="text-xl">📝</span> פרטים כלליים
      </h3>
      
      <div>
        <input 
          type="text" 
          placeholder="שם האימון"
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="w-full p-3 rounded-xl border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all text-sm font-medium"
          required
        />
      </div>

      <div>
        <textarea 
          placeholder="תיאור קצר (מטרת האימון, דגשים...)"
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})}
          className="w-full p-3 rounded-xl border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all text-sm font-medium h-20 resize-none"
        />
      </div>
      
      <div>
        <label className="block text-sm font-bold text-zinc-700 mb-2">בחר קטגוריית אב לאימון:</label>
        <select 
          value={formData.parent_exercise_id} 
          onChange={e => setFormData({...formData, parent_exercise_id: e.target.value, exercises_config: []})}
          className="w-full p-3 rounded-xl border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all text-sm font-medium bg-white"
          required
        >
          <option value="">-- בחר קטגוריה (כולל תתי-קטגוריות) --</option>
          {categoryOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
        <p className="text-xs text-zinc-500 mt-2 font-medium">* שינוי קטגוריה ינקה את רשימת התרגילים הנוכחית.</p>
      </div>
    </section>
  );
};

export default TemplateGeneralInfo;