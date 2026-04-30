import React, { useState, useContext } from 'react';
import { useStats } from '../../contexts/StatsContext';
import { ParameterContext } from '../../contexts/ParameterContext';

const ParameterFormulas = () => {
  const { formulas, addFormula, removeFormula } = useStats();
  const { parameters } = useContext(ParameterContext);
  
  const [formData, setFormData] = useState({
    target_name: '',
    operation: 'multiply',
    source_parameter_ids: [],
    unit: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addFormula(formData);
    setFormData({ target_name: '', operation: 'multiply', source_parameter_ids: [], unit: '' });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200" dir="rtl">
      <h2 className="text-lg font-bold mb-4">Calculation Formulas</h2>
      
      <form onSubmit={handleSubmit} className="space-y-3 bg-blue-50 p-3 rounded mb-6">
        <input 
          placeholder="Formula Name (e.g. Volume)" 
          className="w-full p-2 border rounded"
          value={formData.target_name}
          onChange={(e) => setFormData({...formData, target_name: e.target.value})}
          required
        />
        
        <div className="grid grid-cols-2 gap-2">
          <select 
            className="p-2 border rounded"
            value={formData.operation}
            onChange={(e) => setFormData({...formData, operation: e.target.value})}
          >
            <option value="multiply">Multiply (*)</option>
            <option value="add">Sum (+)</option>
          </select>
          <input 
            placeholder="Unit (e.g. kg)" 
            className="p-2 border rounded"
            value={formData.unit}
            onChange={(e) => setFormData({...formData, unit: e.target.value})}
          />
        </div>

        <div className="max-h-32 overflow-y-auto border p-2 bg-white rounded">
          <label className="block text-xs font-bold mb-1">Select Source Parameters:</label>
          {parameters.map(p => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox"
                checked={formData.source_parameter_ids.includes(p.id)}
                onChange={(e) => {
                  const ids = e.target.checked 
                    ? [...formData.source_parameter_ids, p.id]
                    : formData.source_parameter_ids.filter(id => id !== p.id);
                  setFormData({...formData, source_parameter_ids: ids});
                }}
              /> {p.name}
            </label>
          ))}
        </div>

        <button className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">
          Save Formula
        </button>
      </form>

      <div className="grid grid-cols-1 gap-2">
        {formulas.map(f => (
          <div key={f.id} className="flex justify-between items-center p-3 border rounded bg-white">
            <div>
              <span className="font-bold">{f.target_name}</span>
              <span className="text-xs text-gray-500 mr-2">({f.operation})</span>
            </div>
            <button onClick={() => removeFormula(f.id)} className="text-red-500 font-bold">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParameterFormulas;