import React, { useState } from 'react';
import { useActivity } from '../../hooks/useActivity';

/**
 * Modal component for editing an existing activity log.
 * Allows updating the timestamp and the values of performance parameters.
 */
const ActivityLogEditModal = ({ log, onClose }) => {
  const { editLog } = useActivity();
  
  // Format existing timestamp for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatForInput = (dateStr) => {
    const d = new Date(dateStr);
    const tzOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [timestamp, setTimestamp] = useState(formatForInput(log.timestamp));
  const [performanceData, setPerformanceData] = useState([...log.performance_data]);
  const [isSaving, setIsSaving] = useState(false);

  // Handle change in a specific parameter value
  const handleParamChange = (index, newValue) => {
    const updatedData = [...performanceData];
    updatedData[index] = { ...updatedData[index], value: newValue };
    setPerformanceData(updatedData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await editLog(log.id, {
        timestamp: new Date(timestamp).toISOString(),
        performance_data: performanceData
      });
      onClose();
    } catch (err) {
      alert("שגיאה בעדכון הנתונים");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '15px', padding: '25px',
        width: '90%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        direction: 'rtl'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          עריכת תיעוד ביצוע
        </h3>

        {/* Date & Time Field */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>זמן הביצוע:</label>
          <input 
            type="datetime-local" 
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
        </div>

        {/* Dynamic Parameter Fields */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>נתוני ביצוע:</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {performanceData.map((param, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ flex: 1, fontSize: '14px' }}>{param.parameter_name}:</span>
                <input 
                  type="text" 
                  value={param.value}
                  onChange={(e) => handleParamChange(index, e.target.value)}
                  style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}
                />
                <span style={{ width: '40px', fontSize: '12px', color: '#666' }}>{param.unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose}
            disabled={isSaving}
            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer' }}
          >
            ביטול
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ 
              padding: '10px 20px', borderRadius: '8px', border: 'none', 
              backgroundColor: '#007bff', color: '#fff', cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isSaving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogEditModal;