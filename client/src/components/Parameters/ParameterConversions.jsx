import React, { useState, useContext, useMemo } from 'react';
import { useStats } from '../../contexts/StatsContext';
import { ParameterContext } from '../../contexts/ParameterContext';

const ParameterConversions = () => {
  const { conversions, addConversion, updateConversion, removeConversion } = useStats();
  const { parameters } = useContext(ParameterContext);

  // מצבי ניהול עבור טופס הוספה/עריכה
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    source_parameter_id: '',
    target_name: '',
    multiplier: 1,
    unit: '',
    aggregation_strategy: 'sum'
  });

  // סינון הרשימה לפי טקסט חופשי
  const filteredConversions = useMemo(() => {
    return conversions.filter(c => 
      c.target_name.toLowerCase().includes(filterText.toLowerCase()) ||
      parameters.find(p => p.id === c.source_parameter_id)?.name.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [conversions, filterText, parameters]);

  const resetForm = () => {
    setFormData({ source_parameter_id: '', target_name: '', multiplier: 1, unit: '', aggregation_strategy: 'sum' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateConversion(editingId, formData);
    } else {
      await addConversion(formData);
    }
    resetForm();
  };

  const startEdit = (conv) => {
    setEditingId(conv.id);
    setFormData({
      source_parameter_id: conv.source_parameter_id,
      target_name: conv.target_name,
      multiplier: conv.multiplier,
      unit: conv.unit,
      aggregation_strategy: conv.aggregation_strategy
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100" dir="rtl">
      <header className="mb-6">
        <h2 className="text-xl font-black text-gray-800">המרת יחידות ופרמטרים</h2>
        <p className="text-gray-500 text-sm">צור יחסים בין פרמטרים (לדוגמה: בריכות למטרים)</p>
      </header>

      {/* טופס הוספה / עריכה */}
      <form onSubmit={handleSubmit} className={`p-4 rounded-xl mb-8 border transition-all ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
        <h3 className="text-sm font-bold mb-3 text-gray-700">{editingId ? 'עריכת המרה' : 'המרה חדשה'}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 mr-1">פרמטר מקור</label>
            <select 
              className="p-2.5 rounded-lg border-none shadow-sm text-sm bg-white outline-none focus:ring-2 focus:ring-green-500"
              value={formData.source_parameter_id}
              onChange={(e) => setFormData({...formData, source_parameter_id: parseInt(e.target.value)})}
              required
            >
              <option value="">בחר פרמטר מקור...</option>
              {parameters.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 mr-1">שם פרמטר היעד (החדש)</label>
            <input 
              placeholder="לדוגמה: מרחק כולל" 
              className="p-2.5 rounded-lg border-none shadow-sm text-sm outline-none focus:ring-2 focus:ring-green-500"
              value={formData.target_name}
              onChange={(e) => setFormData({...formData, target_name: e.target.value})}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 mr-1">יחס המרה (מכפיל)</label>
            <input 
              type="number" step="0.0001"
              placeholder="כמה שווה יחידה אחת?" 
              className="p-2.5 rounded-lg border-none shadow-sm text-sm outline-none focus:ring-2 focus:ring-green-500"
              value={formData.multiplier}
              onChange={(e) => setFormData({...formData, multiplier: parseFloat(e.target.value)})}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 mr-1">יחידת מידה חדשה</label>
            <input 
              placeholder="לדוגמה: מטרים" 
              className="p-2.5 rounded-lg border-none shadow-sm text-sm outline-none focus:ring-2 focus:ring-green-500"
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-bold text-gray-500 mr-1">אסטרטגיית צבירה</label>
            <select 
              className="p-2.5 rounded-lg border-none shadow-sm text-sm bg-white outline-none focus:ring-2 focus:ring-green-500"
              value={formData.aggregation_strategy}
              onChange={(e) => setFormData({...formData, aggregation_strategy: e.target.value})}
            >
              <option value="sum">סכימה (Sum)</option>
              <option value="max">שיא אישי (Max)</option>
              <option value="latest">ערך אחרון (Latest)</option>
              <option value="avg">ממוצע (Avg)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button type="submit" className={`flex-1 font-bold py-2.5 rounded-lg transition-all shadow-md active:scale-95 text-sm ${editingId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
            {editingId ? 'עדכן המרה' : 'צור המרה חדשה'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-lg hover:bg-gray-300 text-sm">
              ביטול
            </button>
          )}
        </div>
      </form>

      {/* רשימה וסינון */}
      <div className="space-y-4">
        <div className="relative">
          <input 
            type="text"
            placeholder="חיפוש המרה לפי שם או פרמטר..."
            className="w-full p-2.5 pr-10 rounded-xl border border-gray-100 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-purple-500"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>

        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-1">
          {filteredConversions.map(c => {
            const sourceParam = parameters.find(p => p.id === c.source_parameter_id);
            return (
              <div key={c.id} className="group flex justify-between items-center p-4 border border-gray-100 rounded-xl bg-white hover:border-purple-200 hover:shadow-md transition-all">
                <div className="flex flex-col">
                  <span className="font-black text-gray-800">{c.target_name}</span>
                  <span className="text-xs text-gray-500">
                    מבוסס על <span className="font-bold text-purple-600">{sourceParam?.name || 'פרמטר הוסר'}</span> 
                    (יחס: {c.multiplier} {c.unit})
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => startEdit(c)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="עריכה"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => removeConversion(c.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="מחיקה"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
          
          {filteredConversions.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-50 rounded-2xl">
              לא נמצאו המרות העונות לחיפוש
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParameterConversions;