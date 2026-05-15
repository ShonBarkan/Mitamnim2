import React, { useState, useEffect } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

/**
 * PersonalInfo Component - Profile Management Board.
 * Implements "Arctic Mirror" glassmorphism, fluid view states, and image uploads sync.
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

  // Track account context modifications to keep data unified
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

  /** Shared baseline styles for interactive glass inputs */
  const inputClasses = "w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all placeholder:text-zinc-300 shadow-sm";

  // --- EDIT MODAL OR INLINE FORM STATE ---
  if (isEditing) {
    return (
      <section className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative space-y-8">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/40">
            <div>
              <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase">עריכת פרופיל</h3>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mt-1">Update Personal Identity Credentials</p>
            </div>
            
            {/* Context preview image inside editor */}
            <div className="shrink-0">
              {user?.profile_picture ? (
                <img 
                  src={user.profile_picture} 
                  alt="" 
                  className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-md opacity-60"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-black text-sm border-2 border-white shadow-md opacity-40">
                  {user?.first_name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם פרטי</label>
              <input name="first_name" value={formData.first_name} onChange={handleInputChange} className={inputClasses} placeholder="שם פרטי" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם משפחה</label>
              <input name="second_name" value={formData.second_name} onChange={handleInputChange} className={inputClasses} placeholder="שם משפחה" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">אימייל</label>
              <input name="email" type="email" value={formData.email} onChange={handleInputChange} className={inputClasses} placeholder="אימייל" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">טלפון</label>
              <input name="phone" value={formData.phone} onChange={handleInputChange} className={inputClasses} placeholder="טלפון" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">סיסמה חדשה</label>
              <input name="password" type="password" value={formData.password} onChange={handleInputChange} className={inputClasses} placeholder="השאר ריק כדי לשמור על הסיסמה הנוכחית" />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleSave} 
              className="flex-[2] bg-zinc-900 text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl shadow-2xl shadow-zinc-900/20 transition-all active:scale-[0.98] hover:bg-zinc-800"
            >
              שמור שינויים
            </button>
            <button 
              onClick={() => setIsEditing(false)} 
              className="flex-1 bg-white/60 text-zinc-400 border border-white/80 font-black text-xs uppercase tracking-widest py-5 rounded-2xl transition-all active:scale-95 hover:bg-white hover:text-zinc-900"
            >
              ביטול
            </button>
          </div>
        </div>
      </section>
    );
  }

  // --- STANDARD DISPLAY READ-ONLY FEED STATE ---
  return (
    <section className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[3rem] p-10 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:bg-blue-500/10 transition-colors duration-1000" />
      
      <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-right w-full md:w-auto">
          
          {/* Enhanced Avatar Profile Engine */}
          <div className="relative shrink-0 shadow-xl rounded-[2rem] overflow-hidden group-hover:scale-105 transition-transform duration-500">
            {user?.profile_picture ? (
              <img 
                src={user.profile_picture} 
                alt={`${user.username}'s avatar`} 
                className="w-24 h-24 object-cover border-4 border-white"
              />
            ) : (
              <div className="w-24 h-24 bg-zinc-900 border-4 border-white flex items-center justify-center text-white text-4xl font-black uppercase tracking-tighter">
                {user?.first_name?.[0] || user?.username?.[0]}
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
                {user?.first_name} {user?.second_name}
              </h3>
              <span className="bg-zinc-950 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                {user?.role === 'trainee' ? 'מתאמן' : user?.role === 'trainer' ? 'מאמן' : user?.role}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-1.5 justify-center md:justify-start text-sm font-bold text-zinc-400">
              <p className="flex items-center gap-2 justify-center md:justify-start">
                <span className="opacity-40">📧</span>
                <span className="text-zinc-500 tracking-tight">{user?.email || 'No email associated'}</span>
              </p>
              <p className="flex items-center gap-2 justify-center md:justify-start">
                <span className="opacity-40">📱</span>
                <span className="text-zinc-500 tabular-nums">{user?.phone || 'No phone registered'}</span>
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsEditing(true)} 
          className="w-full md:w-auto bg-white/60 text-zinc-900 border border-white/80 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl shadow-sm hover:shadow-xl hover:bg-white transition-all active:scale-95"
        >
          עריכת פרופיל
        </button>
      </div>
    </section>
  );
};

export default PersonalInfo;