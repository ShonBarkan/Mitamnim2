import React, { useState } from 'react';
import { useStats } from '../../contexts/StatsContext';

const FormulaConfig = ({ parameters }) => {
    const { formulas, addFormula } = useStats();
    const [formData, setFormData] = useState({
        target_name: '',
        operation: 'multiply',
        source_parameter_ids: [],
        unit: ''
    });

    /**
     * Helper function to find a specific parameter name by its ID.
     */
    const getParameterName = (id) => {
        const param = parameters.find(p => p.id === parseInt(id));
        return param ? param.name : id;
    };

    /**
     * Maps an array of parameter IDs to their corresponding names and joins them.
     */
    const renderSourceNames = (ids) => {
        return ids.map(id => getParameterName(id)).join(', ');
    };

    const handleParamToggle = (paramId) => {
        const id = parseInt(paramId);
        setFormData(prev => ({
            ...prev,
            source_parameter_ids: prev.source_parameter_ids.includes(id)
                ? prev.source_parameter_ids.filter(i => i !== id)
                : [...prev.source_parameter_ids, id]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Send the new formula configuration to the backend
        await addFormula(formData);
        setFormData({ target_name: '', operation: 'multiply', source_parameter_ids: [], unit: '' });
    };

    return (
        <div className="p-4 bg-white shadow rounded-lg" dir="rtl">
            <h3 className="text-lg font-bold mb-4 text-right">נוסחאות פרמטרים</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input 
                        type="text" 
                        placeholder="שם תוצאת הנוסחה (למשל: נפח)"
                        value={formData.target_name}
                        onChange={(e) => setFormData({...formData, target_name: e.target.value})}
                        className="border p-2 rounded text-right" 
                        required
                    />
                    <select 
                        value={formData.operation}
                        onChange={(e) => setFormData({...formData, operation: e.target.value})}
                        className="border p-2 rounded text-right"
                    >
                        <option value="multiply">כפל (*)</option>
                        <option value="add">חיבור (+)</option>
                    </select>
                    <input 
                        type="text" 
                        placeholder="יחידה (למשל: ק״ג*חזרות)"
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        className="border p-2 rounded text-right"
                    />
                </div>

                <div className="p-3 border rounded bg-gray-50 text-right">
                    <p className="text-sm text-gray-600 mb-2 font-medium">בחר פרמטרי מקור:</p>
                    <div className="flex flex-wrap gap-3 justify-start">
                        {parameters.map(p => (
                            <label key={p.id} className="flex items-center space-x-1 space-x-reverse cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={formData.source_parameter_ids.includes(p.id)}
                                    onChange={() => handleParamToggle(p.id)}
                                />
                                <span className="text-sm mr-2">{p.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
                    שמור נוסחה
                </button>
            </form>

            <div className="space-y-2">
                {formulas.map(f => (
                    <div key={f.id} className="p-2 bg-gray-100 rounded text-sm text-right">
                        <strong>{f.target_name}:</strong> {renderSourceNames(f.source_parameter_ids)} 
                        <span className="text-gray-500 mr-2">
                            ({f.operation === 'multiply' ? 'כפל' : 'חיבור'})
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FormulaConfig;