import React, { useEffect } from 'react';
import { useUsers } from '../../../hooks/useUsers';
import { useAuth } from '../../../hooks/useAuth';

/**
 * Grid of users for template assignment.
 */
const UserSelectionGrid = ({ selectedUserIds, onChange }) => {
  const { user: currentUser } = useAuth();
  const { users, refreshUsers } = useUsers();

  useEffect(() => {
    if (currentUser?.group_id) refreshUsers(currentUser.group_id);
  }, [currentUser]);

  // Filter only trainees for the selection
  const trainees = users.filter(u => u.role === 'trainee');

  const toggleUser = (userId) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  return (
    <div style={{ direction: 'rtl' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button 
          type="button" 
          onClick={() => onChange(trainees.map(u => u.id))}
          style={smallButtonStyle}
        >
          בחר את כולם
        </button>
        <button 
          type="button" 
          onClick={() => onChange([])}
          style={{ ...smallButtonStyle, backgroundColor: '#f8f9fa', color: '#666', border: '1px solid #ddd' }}
        >
          נקה בחירה
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
        gap: '10px' 
      }}>
        {trainees.map(u => {
          const isSelected = selectedUserIds.includes(u.id);
          return (
            <div 
              key={u.id}
              onClick={() => toggleUser(u.id)}
              style={{
                padding: '10px',
                borderRadius: '10px',
                border: `2px solid ${isSelected ? '#007bff' : '#eee'}`,
                backgroundColor: isSelected ? '#e3f2fd' : '#fff',
                textAlign: 'center',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{u.first_name}</div>
              <div style={{ fontSize: '11px', color: '#666' }}>{u.username}</div>
            </div>
          );
        })}
      </div>
      {trainees.length === 0 && <p style={{ color: '#999', fontSize: '13px' }}>אין מתאמנים רשומים בקבוצה.</p>}
    </div>
  );
};

const smallButtonStyle = { padding: '5px 12px', fontSize: '12px', cursor: 'pointer', border: 'none', borderRadius: '5px', backgroundColor: '#007bff', color: '#fff' };

export default UserSelectionGrid;