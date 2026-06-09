import React, { useState, useEffect } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useAuth } from '../contexts/AuthContext';
import DailyTimeGrid from '../components/SchedulePage/DailyTimeGrid';
import EventModal from '../components/SchedulePage/EventModal';
import EventForm from '../components/SchedulePage/EventForm';
import { Save, Plus, X, User } from 'lucide-react';

const SchedulePage = () => {
  const { 
    currentDate, 
    navigateWeek, 
    jumpToToday, 
    isLoading, 
    saveAllChanges,
    selectedUserId,
    setSelectedUserId,
    mockTrainees 
  } = useSchedule();
  
  const { user } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) setIsModalOpen(false);
      else setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOpenEvent = (timeSlot = null, event = null) => {
    setSelectedSlot(timeSlot);
    setEditingEvent(event);
    
    if (isDesktop) {
      setIsSidebarOpen(true);
      setIsModalOpen(false);
    } else {
      setIsSidebarOpen(false);
      setIsModalOpen(true);
    }
  };

  const handleCloseEvent = () => {
    setIsModalOpen(false);
    setIsSidebarOpen(false);
    setSelectedSlot(null);
    setEditingEvent(null);
  };

  const formattedMonth = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(currentDate);

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden" dir="rtl">
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isDesktop && isSidebarOpen ? 'ml-96' : ''}`}>
        
        <div className="flex justify-between items-center p-4 bg-white shadow-sm border-b z-20">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h1 className="text-2xl font-bold text-gray-800">לוח אימונים</h1>
            
            <div className="flex items-center space-x-2 space-x-reverse bg-gray-100 rounded-lg p-1">
              <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-white rounded shadow-sm transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <span className="font-medium min-w-[120px] text-center text-sm">{formattedMonth}</span>
              <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-white rounded shadow-sm transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
            </div>
            
            <button onClick={jumpToToday} className="text-sm px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition">
              היום
            </button>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'trainer' && (
              <div className="relative flex items-center bg-gray-50 rounded-lg border px-3 py-1.5 shadow-sm hover:shadow transition">
                <User size={16} className="text-gray-400 ml-2" />
                <select 
                  value={selectedUserId} 
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="bg-transparent text-sm font-bold text-gray-700 outline-none pr-2 cursor-pointer"
                >
                  <option value={user.id}>הלו"ז שלי</option>
                  <option value="all">כל המתאמנים</option>
                  {mockTrainees.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}

            {user?.role === 'trainer' && (
              <button 
                onClick={saveAllChanges}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition gap-2 text-sm font-bold"
              >
                <Save size={16} /> שמירה גלובלית
              </button>
            )}
            
            <button 
              onClick={() => handleOpenEvent(new Date())} 
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition gap-2 text-sm font-bold"
            >
              <Plus size={16} /> הוסף אירוע
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative z-0">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
          <DailyTimeGrid 
            onSlotClick={(date) => handleOpenEvent(date)} 
            onEventClick={(ev) => handleOpenEvent(null, ev)} 
          />
        </div>
      </div>

      {isDesktop && isSidebarOpen && (
        <div className="fixed left-0 top-0 h-full w-96 bg-white shadow-2xl z-[60] border-l border-gray-200 animate-in slide-in-from-left duration-300 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="font-bold text-lg">{editingEvent ? 'עריכת אירוע' : 'אירוע חדש'}</h2>
            <button onClick={handleCloseEvent} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <EventForm 
              onClose={handleCloseEvent} 
              initialSlot={selectedSlot}
              existingEvent={editingEvent}
            />
          </div>
        </div>
      )}

      {!isDesktop && isModalOpen && (
        <EventModal onClose={handleCloseEvent}>
           <div className="flex justify-between items-center p-4 border-b shrink-0">
              <h2 className="font-bold text-lg">{editingEvent ? 'עריכת אירוע' : 'אירוע חדש'}</h2>
              <button onClick={handleCloseEvent} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
           </div>
           <div className="flex-1 overflow-hidden relative flex flex-col">
              <EventForm 
                onClose={handleCloseEvent} 
                initialSlot={selectedSlot}
                existingEvent={editingEvent}
              />
           </div>
        </EventModal>
      )}
    </div>
  );
};

export default SchedulePage;