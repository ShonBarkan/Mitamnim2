import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast("אנא מלא את כל השדות", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username, password);
      showToast("ברוך הבא ל-Mitamnim2", "success");
      navigate('/');
    } catch (error) {
      const errMsg = error.response?.data?.detail || "שם משתמש או סיסמה שגויים";
      showToast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-6" dir="rtl">
      
      {/* Login Card */}
      <div className="w-full max-w-[420px] bg-white rounded-[3rem] shadow-2xl shadow-zinc-200/50 p-10 border border-zinc-100 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Logo/Branding Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-zinc-900 rounded-[1.5rem] flex items-center justify-center text-white text-2xl font-black mb-4 shadow-lg shadow-zinc-200">
            M2
          </div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase">Mitamnim2</h2>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-2 italic">Performance Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם משתמש</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Enter your username"
              disabled={isSubmitting}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900/20 transition-all placeholder:text-zinc-200"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mr-2">סיסמה</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              disabled={isSubmitting}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900/20 transition-all placeholder:text-zinc-200"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full bg-zinc-900 text-white rounded-2xl py-5 font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-zinc-200 active:scale-[0.98] mt-4 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-zinc-800'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                מתחבר...
              </span>
            ) : 'כניסה למערכת'}
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-10 text-center border-t border-zinc-50 pt-8">
           <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em]">
             Official Athlete Access Only
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;