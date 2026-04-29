import React, { useState, useEffect } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

/**
 * PersonalInfo Component
 * Displays and allows editing of the current logged-in user's details.
 */
const PersonalInfo = ({ user }) => {
  const { updateUser } = useUsers();
  const { setUser } = useAuth(); 
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    second_name: user?.second_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '' 
  });

  /**
   * Keep the form data in sync if the user prop changes
   */
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        second_name: user.second_name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      
      // Only include password if the user actually typed a new one
      if (!payload.password) {
        delete payload.password;
      }
      
      // 1. Update via the UserContext/Service
      const updatedUser = await updateUser(user.id, payload);
      
      // 2. Update the Global Auth state to trigger UI-wide updates
      if (updatedUser) {
        setUser(updatedUser);
        showToast("הפרטים עודכנו בהצלחה", "success");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Update failed:", error);
      showToast("שגיאה בעדכון הפרטים", "error");
    }
  };

  if (isEditing) {
    return (
      <section style={{ border: '2px solid #007bff', padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f0f8ff' }}>
        <h3 style={{ margin: '0 0 15px' }}>עריכת הפרטים שלי</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input 
            name="first_name" 
            placeholder="שם פרטי" 
            value={formData.first_name} 
            onChange={handleInputChange} 
          />
          <input 
            name="second_name" 
            placeholder="שם משפחה" 
            value={formData.second_name} 
            onChange={handleInputChange} 
          />
          <input 
            name="email" 
            type="email" 
            placeholder="אימייל" 
            value={formData.email} 
            onChange={handleInputChange} 
          />
          <input 
            name="phone" 
            placeholder="טלפון" 
            value={formData.phone} 
            onChange={handleInputChange} 
          />
          <input 
            name="password" 
            type="password" 
            placeholder="סיסמה חדשה (אופציונלי)" 
            value={formData.password} 
            onChange={handleInputChange} 
            style={{ gridColumn: 'span 2' }} 
          />
        </div>
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleSave} 
            style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
          >
            שמור שינויים
          </button>
          <button 
            onClick={() => setIsEditing(false)} 
            style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
          >
            ביטול
          </button>
        </div>
      </section>
    );
  }

  return (
    <section style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
      <div>
        <h3 style={{ margin: '0 0 10px' }}>הפרטים שלי:</h3>
        <p><strong>שם:</strong> {user?.first_name} {user?.second_name}</p>
        <p><strong>אימייל:</strong> {user?.email || 'לא הוזן'}</p>
        <p><strong>טלפון:</strong> {user?.phone || 'לא הוזן'}</p>
        <p><strong>תפקיד:</strong> {user?.role === 'trainee' ? 'מתאמן' : user?.role === 'trainer' ? 'מאמן' : user?.role}</p>
      </div>
      <button 
        onClick={() => setIsEditing(true)} 
        style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
      >
        ערוך פרטים
      </button>
    </section>
  );
};

export default PersonalInfo;