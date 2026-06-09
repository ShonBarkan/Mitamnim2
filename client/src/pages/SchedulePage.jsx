import React, { useState } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useAuth } from '../contexts/AuthContext';
import DailyTimeGrid from '../components/SchedulePage/DailyTimeGrid';
import EventModal from '../components/SchedulePage/EventModal';

const SchedulePage = () => {
  const { currentDate, navigateWeek, jumpToToday, isLoading } = useSchedule();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  const handleOpenModal = (timeSlot = null, event = null) => {
    setSelectedSlot(timeSlot);
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const formattedMonth = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(currentDate);

  return (
    <div className="flex flex-col h-full bg-gray-50" dir="rtl">
      {/* Header section */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm border-b">
        <div className="flex items-center space-x-4 space-x-reverse">
          <h1 className="text-2xl font-bold text-gray-800">לוח אימונים</h1>
          <div className="flex items-center space-x-2 space-x-reverse bg-gray-100 rounded-lg p-1">
            <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-white rounded shadow-sm transition">
              {/* Right Chevron SVG (for previous week in RTL) */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="font-medium min-w-[120px] text-center">{formattedMonth}</span>
            <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-white rounded shadow-sm transition">
              {/* Left Chevron SVG (for next week in RTL) */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <button onClick={jumpToToday} className="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200">
            היום
          </button>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition"
        >
          {/* Plus SVG */}
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          הוסף אירוע
        </button>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
        <DailyTimeGrid onSlotClick={(date) => handleOpenModal(date)} onEventClick={(ev) => handleOpenModal(null, ev)} />
      </div>

      {isModalOpen && (
        <EventModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          initialSlot={selectedSlot}
          existingEvent={editingEvent}
        />
      )}
    </div>
  );
};

export default SchedulePage;