import React from 'react';

/**
 * MainBanners Component - Renders high-end contextual notification banners from management.
 * Fully optimized to render dual stack layouts when general and personal bulletins are active.
 */
const MainBanners = ({ mainMessages = {} }) => {
  const { general, personal } = mainMessages;

  // Render a clean fallback glass block if no messages are active to preserve layout alignment structures
  if (!general && !personal) {
    return (
      <div className="w-full h-full flex flex-col justify-center bg-white/40 backdrop-blur-2xl border border-white/60 p-8 rounded-[2.5rem] shadow-xl min-h-[160px] animate-in fade-in duration-500 select-none" dir="rtl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 font-bold border border-emerald-500/20 text-sm">
            ✓
          </div>
          <div>
            <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight m-0">הכל מעודכן ומיושר בשלב זה</h4>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1 m-0">No immediate broadcast bulletins deployed by leadership</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full h-full animate-in fade-in slide-in-from-right-8 duration-1000 justify-between select-none" dir="rtl">
      <div className="flex flex-col xl:flex-row gap-4 flex-1 items-stretch w-full">
        
        {/* --- CASE A: PERSONAL TARGETED BULLETINS (VIBRANT TRANSITIONAL TINTS) --- */}
        {personal && (
          <div className="group relative overflow-hidden bg-white/40 backdrop-blur-3xl border border-white/60 shadow-2xl shadow-orange-500/5 rounded-[2.5rem] p-6 transition-all hover:bg-white/60 flex-1 flex items-center">
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none" />
            
            <div className="flex items-start gap-5 relative w-full">
              <div className="relative shrink-0">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20 text-xl">
                  📩
                </div>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-600 border-2 border-white rounded-full animate-pulse shadow-sm" />
              </div>
              
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-3 mb-0.5">
                  <span className="text-[9px] font-black text-orange-600 uppercase tracking-[0.25em] whitespace-nowrap leading-none">
                    הודעה אישית מהמאמן {personal.sender?.first_name || personal.sender_name || 'צוות'}
                  </span>
                  <div className="h-px w-full bg-orange-500/10" />
                </div>
                <p className="text-zinc-900 font-black text-lg tracking-tight leading-snug m-0 break-words">
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

            <div className="flex items-start gap-5 relative w-full">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-xl shadow-zinc-900/10 text-xl">
                  📢
                </div>
              </div>
              
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-3 mb-0.5">
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.25em] whitespace-nowrap leading-none">
                    הודעה לכולם מהמאמן {general.sender?.first_name || general.sender_name || 'צוות'}
                  </span>
                  <div className="h-px w-full bg-blue-600/10" />
                </div>
                <p className="text-zinc-700 font-bold text-base leading-relaxed tracking-tight m-0 break-words">
                  {general.content}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* System Identity Footnote Overlay */}
      <div className="px-4 mt-1">
        <p className="text-[8px] font-black text-zinc-400/60 uppercase tracking-[0.4em] italic leading-none m-0">
          Coach-to-Athlete Communication Layer
        </p>
      </div>
    </div>
  );
};

export default MainBanners;