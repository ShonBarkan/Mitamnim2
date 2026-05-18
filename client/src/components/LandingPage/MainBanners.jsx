import React from 'react';

/**
 * MainBanners Component - Renders high-end contextual notification banners from management.
 * Implements bright "Arctic Mirror" glassmorphism layers to align clean visual hierarchy.
 */
const MainBanners = ({ mainMessages = {} }) => {
  const { general, personal } = mainMessages;

  // Render a clean fallback glass block if no messages are active to preserve layout alignment structures
  if (!general && !personal) {
    return (
      <div className="w-full flex flex-col justify-center bg-white/40 backdrop-blur-2xl border border-white/60 p-8 rounded-[2.5rem] shadow-xl min-h-[160px] animate-in fade-in duration-500" dir="rtl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 font-bold border border-emerald-500/20">
            ✓
          </div>
          <div>
            <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">הכל מעודכן ומיושר בשלב זה</h4>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">No immediate broadcast bulletins deployed by leadership</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full h-full animate-in fade-in slide-in-from-right-8 duration-1000 justify-between" dir="rtl">
      
      {/* --- CASE A: PERSONAL TARGETED BULLETINS (VIBRANT TRANSITIONAL TINTS) --- */}
      {personal && (
        <div className="group relative overflow-hidden bg-white/40 backdrop-blur-3xl border border-white/60 shadow-2xl shadow-orange-500/5 rounded-[2.5rem] p-6 transition-all hover:bg-white/60 flex-1 flex items-center">
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none" />
          
          <div className="flex items-start gap-6 relative w-full">
            <div className="relative shrink-0">
              <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20">
                <span className="text-2xl">📩</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 border-2 border-white rounded-full animate-pulse shadow-sm" />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] whitespace-nowrap">
                  הודעה אישית מהמאמן {personal.sender_name}
                </span>
                <div className="h-px w-full bg-orange-500/10" />
              </div>
              <p className="text-zinc-900 font-black text-xl tracking-tight leading-tight">
                {personal.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- CASE B: GENERAL SQUAD BULLETINS (ELECTRIC ARCTIC TINTS) --- */}
      {general && (
        <div className="group relative overflow-hidden bg-white/30 backdrop-blur-3xl border border-white/40 shadow-2xl shadow-blue-500/5 rounded-[2.5rem] p-6 transition-all hover:bg-white/50 flex-1 flex items-center">
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-600/5 to-transparent pointer-events-none" />

          <div className="flex items-start gap-6 relative w-full">
            <div className="shrink-0">
              <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-xl shadow-zinc-900/10">
                <span className="text-2xl">📢</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] whitespace-nowrap">
                  הודעה לכולם מהמאמן {general.sender_name}
                </span>
                <div className="h-px w-full bg-blue-600/10" />
              </div>
              <p className="text-zinc-700 font-bold text-lg leading-relaxed tracking-tight">
                {general.content}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* System Identity Footnote Overlay */}
      <div className="px-4">
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em] italic leading-none opacity-60">
          Coach-to-Athlete Communication Layer
        </p>
      </div>
    </div>
  );
};

export default MainBanners;