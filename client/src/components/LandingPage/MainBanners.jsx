import React from 'react';

/**
 * MainBanners Component - Renders high-end notification banners.
 * Part of the Arctic Mirror design suite, featuring glassmorphism and deep blurs.
 */
const MainBanners = ({ mainMessages }) => {
  const { general, personal } = mainMessages;

  // Render nothing if no messages are active
  if (!general && !personal) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mt-6 animate-in fade-in slide-in-from-right-8 duration-1000" dir="rtl">
      
      {/* --- PERSONAL MESSAGE (VIBRANT CORAL / AMBER) --- */}
      {personal && (
        <div className="group relative overflow-hidden bg-white/40 backdrop-blur-3xl border border-white/60 shadow-2xl shadow-orange-500/10 rounded-[2.5rem] p-6 transition-all hover:bg-white/60">
          {/* Arctic accent gradient */}
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none" />
          
          <div className="flex items-start gap-6 relative">
            {/* Visual Indicator with Pulse */}
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

      {/* --- GENERAL MESSAGE (ELECTRIC ARCTIC BLUE) --- */}
      {general && (
        <div className="group relative overflow-hidden bg-white/30 backdrop-blur-3xl border border-white/40 shadow-2xl shadow-blue-500/5 rounded-[2.5rem] p-6 transition-all hover:bg-white/50">
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-600/5 to-transparent pointer-events-none" />

          <div className="flex items-start gap-6 relative">
            {/* Static Icon for General Announcements */}
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
      
      {/* Decorative System Footnote */}
      <div className="px-6">
        <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] italic">
          Coach-to-Athlete Communication Layer
        </p>
      </div>
    </div>
  );
};

export default MainBanners;