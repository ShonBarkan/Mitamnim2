import React, { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';

/**
 * SenderAvatar Component - Renders the sender's profile picture or initial.
 */
const SenderAvatar = ({ sender }) => (
  <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl border-2 border-white/50 shrink-0 bg-zinc-900 flex items-center justify-center">
    {sender?.profile_picture ? (
      <img src={sender.profile_picture} className="w-full h-full object-cover" alt="Sender" />
    ) : (
      <span className="text-white font-black text-lg">
        {sender?.first_name?.[0] || 'T'}
      </span>
    )}
  </div>
);

/**
 * MainBanners Component - Renders contextual bulletins stacked vertically.
 */
const MainBanners = ({ mainMessages = {} }) => {
  const { general, personal } = mainMessages;
  const { users } = useContext(UserContext); // Access global user list

  // Helper to find the sender's full profile including picture
  const getSenderDetails = (message) => {
    // If sender object already has the picture, return it
    if (message.sender?.profile_picture) return message.sender;
    
    // Otherwise, try to find the full user object in the roster by name
    const senderName = message.sender_name || '';
    return users.find(u => 
      u.first_name === senderName || 
      `${u.first_name} ${u.second_name}` === senderName
    );
  };

  if (!general && !personal) {
    return (
      <div className="w-full flex flex-col justify-center bg-white/40 backdrop-blur-2xl border border-white/60 p-8 rounded-[2.5rem] shadow-xl min-h-[160px] animate-in fade-in duration-500 select-none" dir="rtl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 font-bold border border-emerald-500/20 text-sm">✓</div>
          <div>
            <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight m-0">הכל מעודכן ומיושר בשלב זה</h4>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1 m-0">No immediate broadcast bulletins deployed</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000" dir="rtl">
      
      {/* Personal Targeted Bulletin */}
      {personal && (
        <div className="group relative overflow-hidden bg-white/40 backdrop-blur-3xl border border-white/60 shadow-2xl shadow-orange-500/5 rounded-[2.5rem] p-6 transition-all flex items-center">
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none" />
          <div className="flex items-start gap-5 relative w-full">
            <SenderAvatar sender={getSenderDetails(personal)} />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-3 mb-0.5">
                <span className="text-[9px] font-black text-orange-600 uppercase tracking-[0.25em] leading-none">
                  הודעה אישית מ{personal.sender?.first_name || personal.sender_name || 'המאמן'}
                </span>
                <div className="h-px w-full bg-orange-500/10" />
              </div>
              <p className="text-zinc-900 font-black text-lg tracking-tight leading-snug m-0">{personal.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* General Squad Bulletin */}
      {general && (
        <div className="group relative overflow-hidden bg-white/30 backdrop-blur-3xl border border-white/40 shadow-2xl shadow-blue-500/5 rounded-[2.5rem] p-6 transition-all flex items-center">
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-600/5 to-transparent pointer-events-none" />
          <div className="flex items-start gap-5 relative w-full">
            <SenderAvatar sender={getSenderDetails(general)} />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-3 mb-0.5">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.25em] leading-none">
                  הודעה לכולם מ{general.sender?.first_name || general.sender_name || 'הצוות'}
                </span>
                <div className="h-px w-full bg-blue-600/10" />
              </div>
              <p className="text-zinc-700 font-bold text-base leading-relaxed tracking-tight m-0">{general.content}</p>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default MainBanners;