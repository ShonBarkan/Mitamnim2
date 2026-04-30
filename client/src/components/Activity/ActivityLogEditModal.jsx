import React, { useState, useContext, useCallback } from 'react';
import { useActivity } from '../../hooks/useActivity';
import { ParameterContext } from '../../contexts/ParameterContext';

const ActivityLogEditModal = ({ log, onClose }) => {
  const { editLog } = useActivity();
  const { parameters } = useContext(ParameterContext);
  
  // Format existing timestamp for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatForInput = (dateStr) => {
    const d = new Date(dateStr);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [timestamp, setTimestamp] = useState(formatForInput(log.timestamp));
  const [performanceData, setPerformanceData] = useState([...log.performance_data]);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Internal math engine for virtual parameters calculation.
   * Matches the logic in ActiveWorkoutPage and Backend Service.
   */
  const runMath = useCallback((type, values, multiplier) => {
    const nums = values.map(v => parseFloat(v) || 0);
    switch (type) {
      case 'sum': return nums.reduce((a, b) => a + b, 0);
      case 'subtract': return nums[0] - (nums[1] || 0);
      case 'multiply': return nums.reduce((a, b) => a * b, 1);
      case 'divide': return nums[1] !== 0 ? nums[0] / nums[1] : 0;
      case 'percentage': return nums[1] !== 0 ? (nums[0] / nums[1]) * 100 : 0;
      case 'conversion': return nums[0] * (multiplier || 1);
      default: return 0;
    }
  }, []);

  /**
   * Updates a parameter and triggers recalculation for all dependent virtual parameters.
   */
  const handleParamChange = (pId, newValue) => {
    const updatedData = [...performanceData];
    
    // 1. Find and update the target parameter value
    const targetIdx = updatedData.findIndex(p => p.parameter_id === pId);
    if (targetIdx === -1) return;
    updatedData[targetIdx] = { ...updatedData[targetIdx], value: newValue };

    // 2. Create a lookup map for current values in this set
    const currentValuesMap = {};
    updatedData.forEach(p => {
      currentValuesMap[p.parameter_id] = p.value;
    });

    // 3. Recalculate all virtual parameters in the set
    const fullyUpdatedData = updatedData.map(pEntry => {
      const meta = parameters.find(m => m.id === pEntry.parameter_id);
      
      if (meta?.is_virtual) {
        const sourceIds = meta.source_parameter_ids || [];
        const sourceValues = sourceIds.map(sId => currentValuesMap[sId] || 0);
        const result = runMath(meta.calculation_type, sourceValues, meta.multiplier);
        
        return {
          ...pEntry,
          value: result.toFixed(2).replace(/\.00$/, "")
        };
      }
      return pEntry;
    });

    setPerformanceData(fullyUpdatedData);
  };

  /**
   * Sends the updated log back to the server.
   * Ensures only parameter_id and value are sent in the payload.
   */
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cleanPerformanceData = performanceData.map(p => ({
        parameter_id: p.parameter_id,
        value: String(p.value)
      }));

      await editLog(log.id, {
        timestamp: new Date(timestamp).toISOString(),
        performance_data: cleanPerformanceData
      });
      onClose();
    } catch (err) {
      alert("שגיאה בעדכון הנתונים");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={styles.title}>עריכת תיעוד ביצוע</h3>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>זמן הביצוע:</label>
          <input 
            type="datetime-local" 
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            style={styles.dateTimeInput}
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>נתוני ביצוע:</label>
          <div style={styles.paramsContainer}>
            {performanceData.map((param) => {
              const meta = parameters.find(m => m.id === param.parameter_id);
              const isVirtual = meta?.is_virtual;

              return (
                <div key={param.parameter_id} style={styles.paramRow}>
                  <span style={styles.paramName}>{param.parameter_name}:</span>
                  
                  {isVirtual ? (
                    <div style={styles.virtualDisplay}>{param.value}</div>
                  ) : (
                    <input 
                      type="number" 
                      value={param.value}
                      onChange={(e) => handleParamChange(param.parameter_id, e.target.value)}
                      style={styles.manualInput}
                    />
                  )}
                  <span style={styles.unit}>{param.unit}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.actions}>
          <button onClick={onClose} disabled={isSaving} style={styles.cancelBtn}>
            ביטול
          </button>
          <button onClick={handleSave} disabled={isSaving} style={styles.saveBtn}>
            {isSaving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { backgroundColor: '#fff', borderRadius: '15px', padding: '25px', width: '90%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', direction: 'rtl' },
  title: { marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' },
  fieldGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' },
  dateTimeInput: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' },
  paramsContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  paramRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  paramName: { flex: 1, fontSize: '14px' },
  manualInput: { width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' },
  virtualDisplay: { width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #bae7ff', backgroundColor: '#e6f7ff', color: '#0050b3', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' },
  unit: { width: '40px', fontSize: '12px', color: '#666' },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer' },
  saveBtn: { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#007bff', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }
};

export default ActivityLogEditModal;