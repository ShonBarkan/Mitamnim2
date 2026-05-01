import React from 'react';

/**
 * MainBanners - Arctic Mirror Edition
 * Renders minimalist luxury notification banners with direct coach-to-trainee messaging.
 */
const MainBanners = ({ mainMessages }) => {
  const { general, personal } = mainMessages;

  if (!general && !personal) return null;

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl mt-4 animate-in fade-in slide-in-from-right-4 duration-700">
      
      {/* --- PERSONAL MESSAGE (VIBRANT CORAL) --- */}
      {personal && (
        <div className="group relative overflow-hidden bg-white/40 backdrop-blur-md border border-white shadow-xl shadow-orange-100/20 rounded-3xl p-5 transition-all hover:bg-white/60">
          <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none" />
          
          <div className="flex items-start gap-4 relative">
            <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
              <span className="text-xl">📩</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-black text-orange-600">
                  הודעה אישית לך מהמאמן {personal.sender_name}
                </span>
                <div className="h-px flex-1 bg-orange-100/50" />
              </div>
              <p className="text-zinc-900 font-bold text-lg leading-snug">
                {personal.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- GENERAL MESSAGE (ELECTRIC BLUE) --- */}
      {general && (
        <div className="group relative overflow-hidden bg-white/40 backdrop-blur-md border border-white shadow-xl shadow-blue-100/20 rounded-3xl p-5 transition-all hover:bg-white/60">
          <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />

          <div className="flex items-start gap-4 relative">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-xl">📢</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-black text-blue-600">
                  הודעה לכולם מהמאמן {general.sender_name}
                </span>
                <div className="h-px flex-1 bg-blue-100/50" />
              </div>
              <p className="text-zinc-800 font-medium text-base leading-relaxed">
                {general.content}
              </p>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default MainBanners;