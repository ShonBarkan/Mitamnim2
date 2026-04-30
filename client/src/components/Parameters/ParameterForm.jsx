import React, { useState } from 'react';
import { useParameter } from '../../contexts/ParameterContext';
import { useToast } from '../../hooks/useToast';

/**
 * Independent form component for creating various types of parameters.
 * Supports Raw, Conversion, and multi-operation Virtual parameters (Sum, Subtract, Multiply, Divide, Percentage).
 */
const ParameterForm = ({ onSuccess }) => {
    const { parameters, addParameter } = useParameter();
    const { showToast } = useToast();

    // Initial state for the form
    const initialState = {
        name: '',
        unit: '',
        aggregation_strategy: 'sum',
        is_virtual: false,
        calculation_type: null,
        source_parameter_ids: [],
        multiplier: 1.0
    };

    const [formData, setFormData] = useState(initialState);

    /**
     * Resets form to initial state
     */
    const resetForm = () => {
        setFormData(initialState);
    };

    /**
     * Handles type selection and resets irrelevant virtual fields
     */
    const handleTypeChange = (type) => {
        if (type === 'raw') {
            setFormData(prev => ({ ...prev, is_virtual: false, calculation_type: null, source_parameter_ids: [] }));
        } else {
            setFormData(prev => ({ ...prev, is_virtual: true, calculation_type: type }));
        }
    };

    /**
     * Toggles source parameter selection.
     * For conversion, only one source is allowed. For others, multiple are possible.
     */
    const toggleSourceParam = (id) => {
        setFormData(prev => {
            const ids = [...prev.source_parameter_ids];
            if (ids.includes(id)) {
                return { ...prev, source_parameter_ids: ids.filter(paramId => paramId !== id) };
            } else {
                if (prev.calculation_type === 'conversion') {
                    return { ...prev, source_parameter_ids: [id] };
                }
                return { ...prev, source_parameter_ids: [...ids, id] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation for virtual parameters
        if (formData.is_virtual && formData.source_parameter_ids.length === 0) {
            showToast("Please select at least one source parameter", "error");
            return;
        }

        try {
            await addParameter(formData);
            showToast("הפרמטר נוצר בהצלחה", "success");
            resetForm();
            if (onSuccess) onSuccess();
        } catch (error) {
            showToast("כשל ביצירת פרמטר", "error");
        }
    };

    return (
        <div style={{ 
            direction: 'rtl', 
            padding: '20px', 
            background: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxWidth: '550px',
            margin: '0 auto'
        }}>
            <h3 style={{ marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>
                🆕 יצירת פרמטר חדש
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
                {/* General Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 'bold' }}>שם הפרמטר:</label>
                        <input 
                            required
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 'bold' }}>יחידת מידה:</label>
                        <input 
                            required
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                            value={formData.unit}
                            onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        />
                    </div>
                </div>

                {/* Parameter Logic Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold' }}>סוג פרמטר:</label>
                    <select 
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                        value={!formData.is_virtual ? 'raw' : formData.calculation_type}
                        onChange={(e) => handleTypeChange(e.target.value)}
                    >
                        <option value="raw">רגיל (Raw)</option>
                        <option value="conversion">המרה (Conversion - יחס קבוע)</option>
                        <option value="sum">חיבור (Sum)</option>
                        <option value="subtract">חיסור (Subtract)</option>
                        <option value="multiply">מכפלה (Multiply)</option>
                        <option value="divide">חילוק (Divide)</option>
                        <option value="percentage">אחוזים (Percentage)</option>
                    </select>
                </div>

                {/* Virtual Configuration Section */}
                {formData.is_virtual && (
                    <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px', border: '1px solid #eee' }}>
                        {formData.calculation_type === 'conversion' && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>מקדם הכפלה:</label>
                                <input 
                                    type="number" step="0.0001"
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                                    value={formData.multiplier}
                                    onChange={(e) => setFormData({...formData, multiplier: parseFloat(e.target.value)})}
                                />
                                <small style={{ color: '#666' }}>לדוגמה: 1 בריכה = 25 מטרים, המקדם הוא 25.</small>
                            </div>
                        )}

                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>
                            בחר פרמטרי מקור 
                            { (formData.calculation_type === 'subtract' || formData.calculation_type === 'divide' || formData.calculation_type === 'percentage') && " (בחר 2 פרמטרים לפי הסדר)" }
                        </label>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                            {parameters.filter(p => !p.is_virtual).map(p => (
                                <div 
                                    key={p.id}
                                    onClick={() => toggleSourceParam(p.id)}
                                    style={{
                                        padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        backgroundColor: formData.source_parameter_ids.includes(p.id) ? '#007bff' : '#eee',
                                        color: formData.source_parameter_ids.includes(p.id) ? '#fff' : '#333',
                                        border: '1px solid transparent'
                                    }}>
                                    {formData.source_parameter_ids.indexOf(p.id) !== -1 && (
                                        <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>
                                            {formData.source_parameter_ids.indexOf(p.id) + 1}.
                                        </span>
                                    )}
                                    {p.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stats Strategy */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold' }}>שיטת אגרגציה (לסטטיסטיקה):</label>
                    <select 
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                        value={formData.aggregation_strategy}
                        onChange={(e) => setFormData({...formData, aggregation_strategy: e.target.value})}
                    >
                        <option value="sum">סיכום (Sum)</option>
                        <option value="max">שיא / מקסימום (Max)</option>
                        <option value="min">מינימום (Min)</option>
                        <option value="avg">ממוצע (Avg)</option>
                        <option value="latest">ערך אחרון (Latest)</option>
                    </select>
                </div>

                <button 
                    type="submit"
                    style={{
                        marginTop: '10px', padding: '12px', borderRadius: '8px', border: 'none',
                        backgroundColor: '#007bff', color: 'white', fontWeight: 'bold', cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                >
                    שמור פרמטר במערכת
                </button>
            </form>
        </div>
    );
};

export default ParameterForm;