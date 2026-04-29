import React from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ exercises, selectedExId, onExerciseClick }) => {
  const navigate = useNavigate();

  const renderSidebarTree = (parentId = null, depth = 0) => {
    return exercises
      .filter(ex => ex.parent_id === parentId)
      .map(ex => (
        <div key={ex.id} style={{ marginRight: depth > 0 ? '15px' : '0' }}>
          <div 
            onClick={() => onExerciseClick(ex)}
            style={{ 
              padding: '6px 10px', 
              cursor: 'pointer', 
              backgroundColor: selectedExId === ex.id ? '#e3f2fd' : 'transparent',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '2px',
              transition: '0.2s'
            }}
          >
            {depth > 0 ? '└ ' : ''}{ex.name}
          </div>
          {renderSidebarTree(ex.id, depth + 1)}
        </div>
      ));
  };

  return (
    <aside style={{ flex: '0 0 250px', borderLeft: '1px solid #eee', paddingLeft: '15px' }}>
      <button 
        onClick={() => navigate('/exercises')}
        style={{ 
          width: '100%', padding: '10px', marginBottom: '20px', cursor: 'pointer', 
          borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa' 
        }}
      >
        ⬅ חזור לניהול העץ
      </button>
      <h4 style={{ marginBottom: '15px' }}>עץ תרגילים</h4>
      <div style={{ maxHeight: '75vh', overflowY: 'auto' }}>
        {renderSidebarTree(null)}
      </div>
    </aside>
  );
};

export default Sidebar;