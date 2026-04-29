import React from 'react';

/**
 * Component for scheduling workout days, duration, and start hour.
 */
const TemplateScheduling = ({ 
  scheduledDays, 
  expectedDurationTime, 
  scheduledHour, 
  onDaysChange, 
  onDurationChange, 
  onHourChange 
}) => {
  const days = [
    { label: 'א', value: 0 },
    { label: 'ב', value: 1 },
    { label: 'ג', value: 2 },
    { label: 'ד', value: 3 },
    { label: 'ה', value: 4 },
    { label: 'ו', value: 5 },
    { label: 'ש', value: 6 }
  ];

  const toggleDay = (dayValue) => {
    if (scheduledDays.includes(dayValue)) {
      onDaysChange(scheduledDays.filter(d => d !== dayValue));
    } else {
      onDaysChange([...scheduledDays, dayValue].sort());
    }
  };

  return (
    <div style={{ direction: 'rtl', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Selection of training days */}
      <div>
        <label style={labelStyle}>ימי אימון מיועדים:</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {days.map(day => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                border: `1px solid ${scheduledDays.includes(day.value) ? '#007bff' : '#ddd'}`,
                backgroundColor: scheduledDays.includes(day.value) ? '#007bff' : '#fff',
                color: scheduledDays.includes(day.value) ? '#fff' : '#333',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* Estimated Duration Input */}
        <div>
          <label style={labelStyle}>זמן משוער (דקות):</label>
          <input 
            type="number" 
            min="1"
            value={expectedDurationTime} 
            onChange={(e) => onDurationChange(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Scheduled Start Hour Input */}
        <div>
          <label style={labelStyle}>שעת התחלת אימון:</label>
          <input 
            type="time" 
            value={scheduledHour || ''} 
            onChange={(e) => onHourChange(e.target.value)}
            style={{ ...inputStyle, width: '130px' }}
          />
        </div>
        
      </div>
    </div>
  );
};

// Internal styles
const labelStyle = { 
  display: 'block', 
  marginBottom: '10px', 
  fontSize: '14px', 
  fontWeight: 'bold', 
  color: '#495057' 
};

const inputStyle = { 
  padding: '10px', 
  borderRadius: '8px', 
  border: '1px solid #ddd', 
  width: '100px', 
  fontSize: '15px', 
  outline: 'none',
  textAlign: 'center'
};

export default TemplateScheduling;