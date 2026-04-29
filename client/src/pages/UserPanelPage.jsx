import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import { useGroups } from '../hooks/useGroups';
import { useToast } from '../hooks/useToast';

const UserPanelPage = () => {
  const { user: currentUser } = useAuth();
  const { users, loading, refreshUsers, addUser, deleteUser, updateUser } = useUsers();
  const { groups, refreshGroups } = useGroups();
  const { showToast } = useToast();

  const initialFormState = {
    username: '',
    password: '',
    role: 'trainee',
    first_name: '',
    second_name: '',
    email: '',
    phone: '',
    group_id: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editingUserId, setEditingUserId] = useState(null);

  useEffect(() => {
    refreshUsers(currentUser.role === 'trainer' ? currentUser.group_id : null);
    if (currentUser.role === 'admin') {
      refreshGroups();
    }
  }, [currentUser, refreshUsers, refreshGroups]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setFormData({
      username: user.username,
      password: '', // Leave password empty for security, handle as optional in update
      role: user.role,
      first_name: user.first_name || '',
      second_name: user.second_name || '',
      email: user.email || '',
      phone: user.phone || '',
      group_id: user.group_id || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Logic for group_id: Trainer's users always go to trainer's group
      const finalData = {
        ...formData,
        group_id: currentUser.role === 'trainer' ? currentUser.group_id : formData.group_id
      };

      if (editingUserId) {
        // Update mode: Only send password if it was filled
        const updatePayload = { ...finalData };
        if (!updatePayload.password) delete updatePayload.password;
        
        await updateUser(editingUserId, updatePayload);
        showToast("המשתמש עודכן בהצלחה", "success");
      } else {
        // Create mode
        await addUser(finalData);
        showToast("משתמש נוסף בהצלחה", "success");
      }
      cancelEdit();
    } catch (error) {
      showToast("שגיאה בפעולה: " + (error.response?.data?.detail || "נסה שוב"), "error");
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק משתמש זה?")) {
      try {
        await deleteUser(userId);
        showToast("משתמש נמחק", "success");
      } catch (error) {
        showToast("שגיאה במחיקה", "error");
      }
    }
  };

  return (
    <div style={{ direction: 'rtl' }}>
      <h2>ניהול משתמשים</h2>

      {/* 1. Dynamic Form */}
      <section style={{ border: '1px solid black', padding: '15px', marginBottom: '20px', backgroundColor: editingUserId ? '#f0f8ff' : 'transparent' }}>
        <h3>{editingUserId ? 'עריכת משתמש' : 'הוספת משתמש חדש'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input name="username" placeholder="שם משתמש" value={formData.username} onChange={handleInputChange} required />
          <input name="password" type="password" placeholder={editingUserId ? "סיסמה חדשה (אופציונלי)" : "סיסמה"} value={formData.password} onChange={handleInputChange} required={!editingUserId} />
          <input name="first_name" placeholder="שם פרטי" value={formData.first_name} onChange={handleInputChange} />
          <input name="second_name" placeholder="שם משפחה" value={formData.second_name} onChange={handleInputChange} />
          <input name="email" type="email" placeholder="אימייל" value={formData.email} onChange={handleInputChange} />
          <input name="phone" placeholder="טלפון" value={formData.phone} onChange={handleInputChange} />
          
          <select 
            name="role" 
            value={formData.role} 
            onChange={handleInputChange}
            disabled={editingUserId && currentUser.role !== 'admin'} // ONLY admin can change roles during edit
          >
            <option value="trainee">מתאמן</option>
            {currentUser.role === 'admin' && <option value="trainer">מאמן</option>}
            {currentUser.role === 'admin' && <option value="admin">מנהל</option>}
          </select>

          {currentUser.role === 'admin' && (
            <select name="group_id" value={formData.group_id} onChange={handleInputChange}>
              <option value="">ללא קבוצה</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}

          <div style={{ gridColumn: 'span 2' }}>
            <button type="submit">{editingUserId ? 'עדכן משתמש' : 'הוסף משתמש'}</button>
            {editingUserId && <button type="button" onClick={cancelEdit} style={{ marginRight: '10px' }}>ביטול</button>}
          </div>
        </form>
      </section>

      {/* 2. Enhanced Users Table */}
      <section style={{ overflowX: 'auto' }}>
        <h3>רשימת משתמשים</h3>
        {loading ? <p>טוען...</p> : (
          <table border="1" style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th>שם משתמש</th>
                <th>שם מלא</th>
                <th>אימייל</th>
                <th>טלפון</th>
                <th>תפקיד</th>
                <th>קבוצה</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ backgroundColor: editingUserId === u.id ? '#f0f8ff' : 'transparent' }}>
                  <td>{u.username}</td>
                  <td>{u.first_name} {u.second_name}</td>
                  <td>{u.email || '-'}</td>
                  <td>{u.phone || '-'}</td>
                  <td>{u.role}</td>
                  <td>{groups.find(g => g.id === u.group_id)?.name || 'ללא'}</td>
                  <td>
                    <button onClick={() => startEdit(u)} style={{ color: 'blue', marginLeft: '10px' }}>ערוך</button>
                    <button onClick={() => handleDelete(u.id)} style={{ color: 'red' }}>מחק</button>
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

export default UserPanelPage;