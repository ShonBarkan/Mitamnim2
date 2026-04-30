import React, { useContext, useEffect, useState } from 'react';
import { ParameterContext } from '../../contexts/ParameterContext';
import { useAuth } from '../../hooks/useAuth';
import { useStats } from '../../contexts/StatsContext';
import StatsSettingsGroup from './StatsSettingsGroup';
import ParameterForm from './ParameterForm';

/**
 * Manages the definitions of measurement parameters.
 * Supports CRUD operations for both Raw and Virtual (calculated) parameters.
 */
const ParameterManager = () => {
    const { user } = useAuth();
    const { 
        parameters, 
        fetchParameters, 
        removeParameter, 
        editParameter, 
        loading 
    } = useContext(ParameterContext);
    const { refreshAllConfigs } = useStats(); 
    
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

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

    /**
     * Prepares the edit state with all parameter metadata
     */
    const handleStartEdit = (param) => {
        setEditingId(param.id);
        setEditData({ 
            name: param.name, 
            unit: param.unit, 
            aggregation_strategy: param.aggregation_strategy || 'sum',
            multiplier: param.multiplier || 1.0,
            source_parameter_ids: param.source_parameter_ids || []
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
            console.error("Update failed:", err);
        }
    };

    /**
     * Renders the source parameters or calculation logic as a mathematical string
     */
    const renderLogic = (param) => {
        if (!param.is_virtual) return <span style={{ color: '#888' }}>—</span>;
        
        const sourceNames = param.source_parameter_ids
            ?.map(id => parameters.find(p => p.id === id)?.name || `ID:${id}`);

        if (!sourceNames || sourceNames.length === 0) return <code style={{ color: 'red' }}>Error: No sources</code>;

        switch (param.calculation_type) {
            case 'conversion':
                return <code style={{ color: '#28a745' }}>{sourceNames[0]} * {param.multiplier}</code>;
            case 'sum':
                return <code style={{ color: '#17a2b8' }}>{sourceNames.join(' + ')}</code>;
            case 'subtract':
                return <code style={{ color: '#dc3545' }}>{sourceNames.join(' - ')}</code>;
            case 'multiply':
                return <code style={{ color: '#ffc107' }}>{sourceNames.join(' * ')}</code>;
            case 'divide':
                return <code style={{ color: '#6f42c1' }}>{sourceNames.join(' / ')}</code>;
            case 'percentage':
                return <code style={{ color: '#fd7e14' }}>({sourceNames.join(' / ')}) * 100</code>;
            default:
                return <code style={{ color: '#888' }}>{sourceNames.join(' , ')}</code>;
        }
    };

    return (
        <div style={{ padding: '20px', direction: 'rtl', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ddd' }}>
            <h2 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>פרמטרים למדידה</h2>

            {isTrainer && (
                <div style={{ marginBottom: '20px' }}>
                    {!isAdding ? (
                        <button 
                            onClick={() => setIsAdding(true)} 
                            style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            + הוסף פרמטר חדש
                        </button>
                    ) : (
                        <div style={{ position: 'relative', border: '1px solid #28a745', borderRadius: '12px', padding: '10px' }}>
                            <button 
                                onClick={() => setIsAdding(false)}
                                style={{ position: 'absolute', left: '10px', top: '10px', cursor: 'pointer', border: 'none', background: 'none', fontSize: '18px', zIndex: 1 }}
                            >
                                ✕
                            </button>
                            <ParameterForm onSuccess={() => setIsAdding(false)} />
                        </div>
                    )}
                </div>
            )}

            {loading ? <p>טוען נתונים...</p> : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee', color: '#666' }}>
                                <th style={{ padding: '12px' }}>סוג</th>
                                <th style={{ padding: '12px' }}>שם הפרמטר</th>
                                <th style={{ padding: '12px' }}>יחידה</th>
                                <th style={{ padding: '12px' }}>לוגיקת חישוב</th>
                                <th style={{ padding: '12px' }}>אגרגציה</th>
                                {isTrainer && <th style={{ padding: '12px' }}>פעולות</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {parameters.map(param => (
                                <tr key={param.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: editingId === param.id ? '#fff9e6' : 'transparent' }}>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ 
                                            fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold',
                                            backgroundColor: param.is_virtual ? '#e7f1ff' : '#eee',
                                            color: param.is_virtual ? '#007bff' : '#666'
                                        }}>
                                            {param.is_virtual ? 'VIRTUAL' : 'RAW'}
                                        </span>
                                    </td>

                                    {editingId === param.id ? (
                                        <>
                                            <td style={{ padding: '10px' }}>
                                                <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ padding: '5px', width: '90%' }} />
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <input value={editData.unit} onChange={e => setEditData({...editData, unit: e.target.value})} style={{ padding: '5px', width: '60px' }} />
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                {param.is_virtual && param.calculation_type === 'conversion' && (
                                                    <input 
                                                        type="number" step="0.0001" value={editData.multiplier} 
                                                        onChange={e => setEditData({...editData, multiplier: parseFloat(e.target.value)})}
                                                        style={{ padding: '5px', width: '80px' }}
                                                    />
                                                )}
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <select value={editData.aggregation_strategy} onChange={e => setEditData({...editData, aggregation_strategy: e.target.value})} style={{ padding: '5px' }}>
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
                                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{param.name}</td>
                                            <td style={{ padding: '12px' }}>{param.unit}</td>
                                            <td style={{ padding: '12px', fontSize: '13px' }}>{renderLogic(param)}</td>
                                            <td style={{ padding: '12px', fontSize: '0.9em', color: '#555' }}>
                                                {strategies.find(s => s.id === param.aggregation_strategy)?.label || param.aggregation_strategy}
                                            </td>
                                            {isTrainer && (
                                                <td style={{ padding: '12px' }}>
                                                    <button onClick={() => handleStartEdit(param)} style={{ color: '#007bff', border: 'none', background: 'none', cursor: 'pointer', marginLeft: '15px' }}>ערוך ✎</button>
                                                    <button onClick={() => { if(window.confirm('למחוק את הפרמטר?')) removeParameter(param.id) }} style={{ color: '#dc3545', border: 'none', background: 'none', cursor: 'pointer' }}>מחק 🗑</button>
                                                </td>
                                            )}
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isTrainer && <StatsSettingsGroup />}
        </div>
    );
};

export default ParameterManager;