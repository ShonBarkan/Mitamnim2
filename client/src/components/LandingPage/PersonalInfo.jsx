import React, { useState, useEffect, useRef } from 'react';
import { useUsers } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { uploadToCloudinary } from '../../utils/cloudinary';
import FrontendLogger from '../../utils/logger';

/**
 * PersonalInfo Component - Profile Management Board for the active athlete.
 * Implements "Arctic Mirror" glassmorphism, fluid view states, and dynamic Cloudinary asset synchronization.
 */
const PersonalInfo = ({ user }) => {
  const { updateUser } = useUsers();
  const { setUser } = useAuth();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    second_name: user?.second_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: ''
  });

  const fileInputRef = useRef(null);

  // Synchronize internal state with profile modifications
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        second_name: user.second_name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: ''
      });
      setPreviewUrl(user.profile_picture || '');
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Captures binary target streams and caches a local visual preview token
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      FrontendLogger.info('PERSONAL_INFO', `Local profile avatar chosen: ${file.name}`);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  /**
   * Commits current context profile attributes and cloud asset links back to backend layers
   */
  const handleSave = async () => {
    FrontendLogger.info('PERSONAL_INFO', 'Initiating self profile update database transaction pipeline');
    setIsUploading(true);

    try {
      let finalImageUrl = user?.profile_picture || null;

      if (selectedFile) {
        finalImageUrl = await uploadToCloudinary(selectedFile);
      }

      const payload = { 
        ...formData,
        profile_picture: finalImageUrl
      };
      
      if (!payload.password) delete payload.password;

      const updatedUser = await updateUser(user.id, payload);

      if (updatedUser) {
        setUser(updatedUser);
        showToast("הפרטים עודכנו בהצלחה", "success");
        setIsEditing(false);
        setSelectedFile(null);
      }
    } catch (error) {
      FrontendLogger.error('PERSONAL_INFO', 'Exception caught while updating athlete self profile configuration parameters', error);
      showToast("שגיאה בעדכון הפרטים", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    FrontendLogger.info('PERSONAL_INFO', 'Evicting unsaved profile form modifications');
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(user?.profile_picture || '');
  };

  const inputClasses = "w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all placeholder:text-zinc-300 shadow-sm";

  // --- INTERACTIVE PROFILE EDITOR VIEW STATE ---
  if (isEditing) {
    return (
      <section className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative space-y-8">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/40">
            <div>
              <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase">עריכת פרופיל אתלט</h3>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mt-1">Update Personal Identity Credentials</p>
            </div>
            
            {/* Real-time configuration image profile preview inside editor frame */}
            <div className="flex items-center gap-4">
              <button 
                type="button" 
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/70 hover:bg-white border border-white/90 rounded-xl py-2 px-4 text-xs font-black text-zinc-700 transition-all active:scale-95 shadow-sm"
              >
                החלף תמונה 📸
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

              <div className="shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-md" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-black text-sm border-2 border-white shadow-md opacity-40">
                    {user?.first_name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם פרטי</label>
              <input name="first_name" value={formData.first_name} onChange={handleInputChange} disabled={isUploading} className={inputClasses} placeholder="שם פרטי" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם משפחה</label>
              <input name="second_name" value={formData.second_name} onChange={handleInputChange} disabled={isUploading} className={inputClasses} placeholder="שם משפחה" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">אימייל</label>
              <input name="email" type="email" value={formData.email} onChange={handleInputChange} disabled={isUploading} className={inputClasses} placeholder="אימייל" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">טלפון</label>
              <input name="phone" value={formData.phone} onChange={handleInputChange} disabled={isUploading} className={inputClasses} placeholder="טלפון" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שדרוג סיסמה (אופציונלי)</label>
              <input name="password" type="password" value={formData.password} onChange={handleInputChange} disabled={isUploading} className={inputClasses} placeholder="השאר ריק כדי לשמור על הסיסמה הנוכחית" />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-end">
            <button 
              onClick={handleCancel} 
              disabled={isUploading}
              className="px-8 py-4 bg-white/60 text-zinc-400 border border-white/80 font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all active:scale-95 hover:bg-white hover:text-zinc-900"
            >
              ביטול
            </button>
            <button 
              onClick={handleSave} 
              disabled={isUploading}
              className="px-12 py-4 bg-zinc-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-zinc-900/20 transition-all active:scale-[0.98] hover:bg-zinc-800 disabled:opacity-40 flex items-center gap-2"
            >
              {isUploading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
              שמור שינויים
            </button>
          </div>
        </div>
      </section>
    );
  }

  // --- STANDARD READ-ONLY ATHLETE SHEET STATE ---
  return (
    <section className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[3rem] p-6 md:p-10 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />
      
      <div className="relative flex flex-col items-center gap-6 text-center w-full">
        
        {/* Avatar and Edit Button Container */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="relative shadow-xl rounded-[2rem] overflow-hidden w-24 h-24 bg-zinc-100 border-4 border-white flex items-center justify-center">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-white text-4xl font-black uppercase tracking-tighter">
                {user?.first_name?.[0] || user?.username?.[0]}
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              FrontendLogger.info('PERSONAL_INFO', 'Athlete triggered inline profile edit mode');
              setIsEditing(true);
            }} 
            className="bg-white/60 hover:bg-white text-zinc-900 border border-white/80 font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95"
          >
            עריכה
          </button>
        </div>
        
        {/* User Details */}
        <div className="space-y-3 flex-1 w-full">
          <div className="flex flex-col items-center gap-3">
            <h3 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
              {user?.first_name} {user?.second_name}
            </h3>
            <span className="bg-zinc-950 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
              {user?.role === 'trainee' ? 'מתאמן' : user?.role === 'trainer' ? 'מאמן' : user?.role}
            </span>
          </div>
          
          <div className="flex flex-col gap-2 text-sm font-bold text-zinc-400">
            <p className="flex items-center gap-2 justify-center">
              <span>📧</span>
              <span className="text-zinc-500 tracking-tight">{user?.email || 'אין אימייל'}</span>
            </p>
            <p className="flex items-center gap-2 justify-center">
              <span>📱</span>
              <span className="text-zinc-500 tabular-nums">{user?.phone || 'אין טלפון'}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PersonalInfo;