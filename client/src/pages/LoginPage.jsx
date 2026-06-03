import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import FrontendLogger from '../utils/logger';

/**
 * LoginPage Component - Implements the Arctic Mirror (Glassmorphism) theme.
 * Features a high-end, transparent UI for athlete authentication.
 * All user-facing text has been localized to Hebrew per system requirements.
 */
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Redirect to home if user is already authenticated
  useEffect(() => {
    FrontendLogger.info('LOGIN_PAGE', 'Mounting authentication gateway view');
    if (user) {
      FrontendLogger.info('LOGIN_PAGE', 'Authenticated active footprint discovered, rerouting to index anchor');
      navigate('/');
    }
  }, [user, navigate]);

  /**
   * Handles the login form submission pipeline.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    FrontendLogger.info('LOGIN_PAGE', 'Intercepted credential submission event trigger');

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
      const errMsg = error.response?.data?.detail || error.message || "שם משתמש או סיסמה שגויים";
      showToast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-zinc-200 font-sans p-6" dir="rtl">
      
      {/* Arctic Mirror Login Card */}
      <div className="w-full max-w-[440px] bg-white/40 backdrop-blur-2xl rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] p-8 md:p-12 border border-white/60 animate-in fade-in zoom-in-95 duration-1000">
        
        {/* Branding Header */}
        <div className="flex flex-col items-center mb-10 md:mb-12 text-center">
          <div className="w-20 h-20 bg-zinc-900/90 backdrop-blur-md rounded-[2rem] flex items-center justify-center text-white text-3xl font-black mb-6 shadow-2xl shadow-zinc-900/20 active:scale-95 transition-transform">
            M2
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tighter uppercase">MITAMNIM 2</h2>
          <p className="text-[10px] md:text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] md:tracking-[0.4em] mt-3 opacity-70">
            מערכת ניהול ביצועים לספורטאים
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          {/* Username Input Group */}
          <div className="space-y-3">
            <label className="text-[12px] font-black uppercase tracking-widest text-zinc-500 mr-4">שם משתמש</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="הכנס שם משתמש"
              disabled={isSubmitting}
              className="w-full bg-white/50 border border-white/40 rounded-[1.5rem] md:rounded-3xl px-6 py-4 md:px-8 md:py-5 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 focus:border-zinc-900/20 transition-all placeholder:text-zinc-400"
            />
          </div>

          {/* Password Input Group */}
          <div className="space-y-3">
            <label className="text-[12px] font-black uppercase tracking-widest text-zinc-500 mr-4">סיסמה</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              disabled={isSubmitting}
              className="w-full bg-white/50 border border-white/40 rounded-[1.5rem] md:rounded-3xl px-6 py-4 md:px-8 md:py-5 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 focus:border-zinc-900/20 transition-all placeholder:text-zinc-400"
            />
          </div>

          {/* Submit Action */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full bg-zinc-900 text-white rounded-[1.5rem] md:rounded-[2rem] py-5 md:py-6 font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl shadow-zinc-900/20 active:scale-[0.97] mt-6 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-800 hover:shadow-zinc-900/30'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                מעבד נתונים...
              </span>
            ) : 'כניסה למערכת'}
          </button>
        </form>

        {/* Access Footer */}
        <div className="mt-10 md:mt-12 text-center border-t border-zinc-900/5 pt-8 md:pt-10">
           <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] md:tracking-[0.5em] leading-loose">
             גישה מורשית לספורטאים בלבד<br/>
             <span className="opacity-40 italic">כניסה לא מורשית מתועדת במערכת</span>
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;