import React, { useState } from 'react';
import { useStats } from '../../contexts/StatsContext';

const ConversionConfig = ({ parameters = [] }) => {
  const { conversions, addConversion, removeConversion } = useStats();
  const [formData, setFormData] = useState({
    source_parameter_id: '',
    multiplier: 1,
    target_name: '',
    unit: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addConversion(formData);
      // Reset form after successful submission
      setFormData({
        source_parameter_id: '',
        multiplier: 1,
        target_name: '',
        unit: ''
      });
    } catch (error) {
      console.error("Failed to create conversion:", error);
    }
  };

  return (
    <div className="p-6 bg-white shadow-xl rounded-2xl border border-gray-100" dir="rtl">
      <h3 className="text-xl font-black text-gray-800 mb-6">המרות פרמטרים</h3>
      
      {/* Creation Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8 bg-gray-50 p-4 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 mr-1">פרמטר מקור</label>
            <select 
              value={formData.source_parameter_id}
              onChange={(e) => setFormData({...formData, source_parameter_id: parseInt(e.target.value)})}
              className="w-full p-2.5 rounded-lg border-none shadow-sm text-sm font-medium focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">בחר פרמטר...</option>
              {parameters.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 mr-1">מכפיל (Multiplier)</label>
            <input 
              type="number"
              step="0.001"
              value={formData.multiplier}
              onChange={(e) => setFormData({...formData, multiplier: parseFloat(e.target.value)})}
              className="w-full p-2.5 rounded-lg border-none shadow-sm text-sm font-medium focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 mr-1">שם יעד (Label)</label>
            <input 
              type="text"
              placeholder="לדוגמה: משקל כולל"
              value={formData.target_name}
              onChange={(e) => setFormData({...formData, target_name: e.target.value})}
              className="w-full p-2.5 rounded-lg border-none shadow-sm text-sm font-medium focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 mr-1">יחידת מידה חדשה</label>
            <input 
              type="text"
              placeholder="לדוגמה: lbs"
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              className="w-full p-2.5 rounded-lg border-none shadow-sm text-sm font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95"
        >
          צור המרה חדשה
        </button>
      </form>

      {/* Existing Conversions List */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 mr-1">המרות קיימות</h4>
        {conversions.length === 0 ? (
          <p className="text-center py-4 text-gray-400 italic text-sm">טרם הוגדרו המרות.</p>
        ) : (
          conversions.map((conv) => (
            <div key={conv.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
              <div className="text-right">
                <div className="font-bold text-gray-800">{conv.target_name}</div>
                <div className="text-xs text-blue-500 font-medium">
                  {parameters.find(p => p.id === conv.source_parameter_id)?.name || 'Unknown'} × {conv.multiplier} = {conv.unit}
                </div>
              </div>
              <button 
                onClick={() => removeConversion(conv.id)}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversionConfig;