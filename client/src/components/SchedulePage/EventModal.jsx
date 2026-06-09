import React from 'react';

const EventModal = ({ onClose, children }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6" dir="rtl">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in duration-200 max-h-[90vh] flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default EventModal;