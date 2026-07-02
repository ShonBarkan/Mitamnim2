import React from 'react';
import IntervalTimer from '../common/IntervalTimer/IntervalTimer';

const MobileTimerModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] lg:hidden bg-zinc-900/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header for mobile modal */}
        <div className="p-4 flex justify-between items-center border-b border-zinc-100 sticky top-0 bg-white/90 backdrop-blur z-10">
           <h3 className="font-black text-zinc-900">טיימר אינטרוולים</h3>
           <button 
             onClick={onClose}
             className="w-8 h-8 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-full transition-colors"
           >
             ✕
           </button>
        </div>
        <div className="p-4">
           <IntervalTimer />
        </div>
      </div>
    </div>
  );
};

export default MobileTimerModal;