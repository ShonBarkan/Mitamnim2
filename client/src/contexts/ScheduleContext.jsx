import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { scheduleService } from '../services/scheduleService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext'; // Updated to use your custom toast context

const ScheduleContext = createContext();

export const useSchedule = () => useContext(ScheduleContext);

export const ScheduleProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast(); // Pulling the custom showToast method
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate Sunday to Saturday of the current selected week
  const getWeekRange = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust to Sunday
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { startOfWeek, endOfWeek };
  };

  const fetchEvents = useCallback(async (targetUserId = user?.id) => {
    if (!targetUserId) return;
    setIsLoading(true);
    try {
      const { startOfWeek, endOfWeek } = getWeekRange(currentDate);
      const data = await scheduleService.getSchedule(targetUserId, startOfWeek, endOfWeek);
      
      // Parse UTC dates to local Javascript Date objects
      const parsedEvents = data.map(ev => ({
        ...ev,
        start_time: new Date(ev.start_time),
        end_time: new Date(ev.end_time)
      }));
      
      setEvents(parsedEvents);
      setError(null);
    } catch (err) {
      setError('שגיאה בטעינת לוח הזמנים');
      showToast('שגיאה בטעינת לוח הזמנים', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, user, showToast]); // Added showToast to dependencies

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const navigateWeek = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  const jumpToToday = () => setCurrentDate(new Date());

  const handleActionResponse = (response) => {
    if (response.has_overlap) {
      showToast('שים לב: קיימת חפיפה עם אירוע אחר בזמן זה', 'error');
    } else {
      showToast('נשמר בהצלחה', 'success');
    }
    fetchEvents();
  };

  return (
    <ScheduleContext.Provider value={{
      currentDate,
      events,
      isLoading,
      error,
      navigateWeek,
      jumpToToday,
      fetchEvents,
      handleActionResponse
    }}>
      {children}
    </ScheduleContext.Provider>
  );
};