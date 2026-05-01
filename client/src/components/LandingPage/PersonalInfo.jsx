import React, { useState, useEffect } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

/**
 * PersonalInfo Component - Arctic Mirror Edition
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
      if (!payload.password) delete payload.password;

      const updatedUser = await updateUser(user.id, payload);

      if (updatedUser) {
        setUser(updatedUser);
        showToast("הפרטים עודכנו בהצלחה", "success");
        setIsEditing(false);
      }
    } catch (error) {
      showToast("שגיאה בעדכון הפרטים", "error");
    }
  };

  // --- Input Styling Helper ---
  const inputClasses = "w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all";

  if (isEditing) {
    return (
      <section className="bg-white/70 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 shadow-2xl shadow-blue-100/50 transition-all duration-500 overflow-hidden relative">
        {/* Decorative background element */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-100/30 rounded-full blur-3xl" />
        
        <div className="relative">
          <header className="mb-8">
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">עריכת פרופיל</h3>
            <p className="text-zinc-500 text-sm font-medium">עדכן את הפרטים האישיים שלך במידת הצורך</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 mr-2 uppercase tracking-widest">שם פרטי</label>
              <input name="first_name" value={formData.first_name} onChange={handleInputChange} className={inputClasses} placeholder="שם פרטי" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 mr-2 uppercase tracking-widest">שם משפחה</label>
              <input name="second_name" value={formData.second_name} onChange={handleInputChange} className={inputClasses} placeholder="שם משפחה" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 mr-2 uppercase tracking-widest">אימייל</label>
              <input name="email" type="email" value={formData.email} onChange={handleInputChange} className={inputClasses} placeholder="אימייל" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 mr-2 uppercase tracking-widest">טלפון</label>
              <input name="phone" value={formData.phone} onChange={handleInputChange} className={inputClasses} placeholder="טלפון" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-zinc-400 mr-2 uppercase tracking-widest">סיסמה חדשה</label>
              <input name="password" type="password" value={formData.password} onChange={handleInputChange} className={inputClasses} placeholder="השאר ריק כדי לא לשנות" />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button 
              onClick={handleSave} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              שמור שינויים
            </button>
            <button 
              onClick={() => setIsEditing(false)} 
              className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold py-4 rounded-2xl transition-all"
            >
              ביטול
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white/80 backdrop-blur-2xl border border-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 transition-all hover:shadow-blue-100/40 relative overflow-hidden group">
      {/* Arctic Mirror highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-blue-100 transition-colors duration-700" />
      
      <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
          {/* Avatar Placeholder */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-white border border-white shadow-inner flex items-center justify-center text-3xl shadow-blue-50">
            {user?.first_name?.[0] || user?.username?.[0]}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h3 className="text-3xl font-black text-zinc-900 tracking-tight">
                {user?.first_name} {user?.second_name}
              </h3>
              <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                {user?.role === 'trainee' ? 'מתאמן' : user?.role === 'trainer' ? 'מאמן' : user?.role}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-1 justify-center md:justify-start">
              <p className="flex items-center gap-1.5 text-zinc-500 font-medium">
                <span className="opacity-40 text-xs">📧</span> {user?.email || 'לא הוזן אימייל'}
              </p>
              <p className="flex items-center gap-1.5 text-zinc-500 font-medium">
                <span className="opacity-40 text-xs">📱</span> {user?.phone || 'לא הוזן טלפון'}
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsEditing(true)} 
          className="w-full md:w-auto bg-white border border-zinc-200 hover:border-blue-300 text-zinc-900 font-black px-8 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          עריכת פרופיל
        </button>
      </div>
    </section>
  );
};

export default PersonalInfo;