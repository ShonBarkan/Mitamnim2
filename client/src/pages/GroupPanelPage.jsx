import React, { useState, useEffect } from 'react';
import { useGroups } from '../hooks/useGroups';
import { useToast } from '../hooks/useToast';

const GroupPanelPage = () => {
  // Assuming updateGroup exists in your useGroups hook
  const { groups, loading, refreshGroups, addGroup, deleteGroup, updateGroup } = useGroups();
  const { showToast } = useToast();

  // States for the form
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState('');
  
  // Track which group is being edited (null means we are in 'Create' mode)
  const [editingGroupId, setEditingGroupId] = useState(null);

  useEffect(() => {
    refreshGroups();
  }, [refreshGroups]);

  // Pre-fill the form with group data to start editing
  const startEdit = (group) => {
    setEditingGroupId(group.id);
    setGroupName(group.name);
    setGroupImage(group.group_image || '');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll up to the form
  };

  // Reset form and exit edit mode
  const cancelEdit = () => {
    setEditingGroupId(null);
    setGroupName('');
    setGroupImage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName) {
      showToast("אנא הזן שם לקבוצה", "error");
      return;
    }

    try {
      if (editingGroupId) {
        // Edit mode: Update existing group
        await updateGroup(editingGroupId, { 
          name: groupName, 
          group_image: groupImage || null 
        });
        showToast("הקבוצה עודכנה בהצלחה", "success");
      } else {
        // Create mode: Add new group
        await addGroup({ 
          name: groupName, 
          group_image: groupImage || null 
        });
        showToast("קבוצה נוצרה בהצלחה", "success");
      }
      cancelEdit(); // Reset form
    } catch (error) {
      showToast("שגיאה בפעולה: " + (error.response?.data?.detail || "נסה שוב"), "error");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm("האם אתה בטוח? מחיקת קבוצה עלולה להשפיע על המשתמשים המשויכים אליה.")) {
      try {
        await deleteGroup(groupId);
        showToast("קבוצה נמחקה", "success");
        if (editingGroupId === groupId) cancelEdit();
      } catch (error) {
        showToast("שגיאה במחיקה", "error");
      }
    }
  };

  return (
    <div style={{ direction: 'rtl' }}>
      <h2>ניהול קבוצות (מנהל בלבד)</h2>

      {/* 1. Dynamic Form (Create or Edit) */}
      <section style={{ border: '2px solid black', padding: '15px', marginBottom: '20px', backgroundColor: editingGroupId ? '#fff9e6' : 'transparent' }}>
        <h3>{editingGroupId ? 'עריכת קבוצה' : 'יצירת קבוצה חדשה'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <input 
              type="text" 
              placeholder="שם הקבוצה" 
              value={groupName} 
              onChange={(e) => setGroupName(e.target.value)} 
              style={{ marginLeft: '10px' }}
            />
            <input 
              type="text" 
              placeholder="נתיב/קישור לתמונה" 
              value={groupImage} 
              onChange={(e) => setGroupImage(e.target.value)} 
            />
          </div>
          <button type="submit" style={{ backgroundColor: editingGroupId ? '#ffa500' : '#4CAF50', color: 'white', padding: '5px 15px', border: 'none', cursor: 'pointer' }}>
            {editingGroupId ? 'עדכן קבוצה' : 'צור קבוצה'}
          </button>
          
          {editingGroupId && (
            <button type="button" onClick={cancelEdit} style={{ marginRight: '10px', cursor: 'pointer' }}>
              ביטול עריכה
            </button>
          )}
        </form>
      </section>

      {/* 2. Groups Table */}
      <section>
        <h3>רשימת קבוצות קיימות</h3>
        {loading ? <p>טוען נתונים...</p> : (
          <table border="1" style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th>תמונה</th>
                <th>שם הקבוצה</th>
                <th>מזהה (UUID)</th>
                <th>תאריך יצירה</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} style={{ backgroundColor: editingGroupId === group.id ? '#fff9e6' : 'transparent' }}>
                  <td style={{ textAlign: 'center', padding: '5px' }}>
                    {group.group_image ? (
                      <img src={group.group_image} alt={group.name} style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '10px', color: '#ccc' }}>ללא</span>
                    )}
                  </td>
                  <td>{group.name}</td>
                  <td style={{ fontSize: '12px', color: '#666' }}>{group.id}</td>
                  <td>{new Date(group.created_at).toLocaleDateString('he-IL')}</td>
                  <td>
                    <button onClick={() => startEdit(group)} style={{ color: 'blue', marginLeft: '10px' }}>ערוך</button>
                    <button onClick={() => handleDeleteGroup(group.id)} style={{ color: 'red' }}>מחק</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default GroupPanelPage;