import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { scheduleService } from '../services/scheduleService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const ScheduleContext = createContext();

export const useSchedule = () => useContext(ScheduleContext);

const generateMockSchedule = () => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return [
    {
      user_id: 'trainee-1',
      user_name: 'דניאל ישראלי',
      user_picture: 'https://picsum.photos/seed/daniel/100',
      events: [
        {
          id: 'mock-1',
          title: 'אימון כוח בוקר',
          event_type: 'template',
          template_id: 'temp-1',
          start_time: `${todayStr}T09:00:00`,
          end_time: `${todayStr}T10:30:00`,
          user_id: 'trainee-1',
          user_name: 'דניאל ישראלי',
          user_picture: 'https://picsum.photos/seed/daniel/100'
        },
        {
          id: 'mock-2',
          title: 'מבדק משקלים',
          event_type: 'test',
          start_time: `${tomorrowStr}T14:00:00`,
          end_time: `${tomorrowStr}T14:30:00`,
          user_id: 'trainee-1',
          user_name: 'דניאל ישראלי',
          user_picture: 'https://picsum.photos/seed/daniel/100'
        }
      ]
    },
    {
      user_id: 'trainee-2',
      user_name: 'מיכל אהרון',
      user_picture: 'https://picsum.photos/seed/michal/100',
      events: [
        {
          id: 'mock-3',
          title: 'ריצת שטח',
          event_type: 'personal',
          start_time: `${todayStr}T17:00:00`,
          end_time: `${todayStr}T18:00:00`,
          user_id: 'trainee-2',
          user_name: 'מיכל אהרון',
          user_picture: 'https://picsum.photos/seed/michal/100'
        }
      ]
    },
    {
      user_id: 'trainee-3',
      user_name: 'רוני כהן',
      user_picture: 'https://picsum.photos/seed/roni/100',
      events: []
    }
  ];
};

export const ScheduleProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]); 
  const [localEvents, setLocalEvents] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [mockTrainees, setMockTrainees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(user?.id); 

  const getWeekRange = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return { startOfWeek, endOfWeek };
  };

  const fetchEvents = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const mockData = generateMockSchedule();
      setMockTrainees(mockData.map(t => ({ id: t.user_id, name: t.user_name })));

      let fetchedEvents = [];

      if (selectedUserId === 'all') {
        mockData.forEach(trainee => {
          fetchedEvents = [...fetchedEvents, ...trainee.events];
        });
      } else if (selectedUserId !== user.id) {
        const trainee = mockData.find(t => t.user_id === selectedUserId);
        if (trainee) fetchedEvents = [...trainee.events];
      } else {
         fetchedEvents = [];
      }

      const parsedEvents = fetchedEvents.map(ev => ({
        ...ev,
        start_time: new Date(ev.start_time),
        end_time: new Date(ev.end_time)
      }));
      
      setEvents(parsedEvents);
      setLocalEvents(parsedEvents); 
      setError(null);
    } catch (err) {
      setError('Failed to load schedule');
      showToast('שגיאה בטעינת לוח הזמנים', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, user, selectedUserId, showToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  const generateRecurringEvents = (baseEvent) => {
    const { recurrence_type, recurrence_count = 5 } = baseEvent;
    if (!recurrence_type || recurrence_type === 'none') {
      return [{ ...baseEvent, id: baseEvent.id || `temp-${Date.now()}` }];
    }

    const series = [];
    const seriesId = `series-${Date.now()}`;
    let currentStart = new Date(baseEvent.start_time);
    let currentEnd = new Date(baseEvent.end_time);
    const duration = currentEnd - currentStart;

    for (let i = 0; i < recurrence_count; i++) {
      series.push({
        ...baseEvent,
        id: `temp-${Date.now()}-${i}`,
        series_id: seriesId,
        start_time: new Date(currentStart),
        end_time: new Date(currentStart.getTime() + duration)
      });

      if (recurrence_type === 'daily') currentStart.setDate(currentStart.getDate() + 1);
      else if (recurrence_type === 'weekly') currentStart.setDate(currentStart.getDate() + 7);
      else if (recurrence_type === 'bi-weekly') currentStart.setDate(currentStart.getDate() + 14);
      else if (recurrence_type === 'monthly') currentStart.setMonth(currentStart.getMonth() + 1);
    }
    return series;
  };

  const addEventLocally = (newEvent) => {
    const series = generateRecurringEvents(newEvent);
    setLocalEvents(prev => [...prev, ...series]);
  };

  const updateEventLocally = (updatedEvent, applyToSeries = false) => {
    setLocalEvents(prev => prev.map(ev => {
      if (applyToSeries && updatedEvent.series_id && ev.series_id === updatedEvent.series_id) {
        const newStart = new Date(ev.start_time);
        newStart.setHours(updatedEvent.start_time.getHours(), updatedEvent.start_time.getMinutes());
        const newEnd = new Date(newStart.getTime() + (updatedEvent.end_time - updatedEvent.start_time));
        return { ...updatedEvent, id: ev.id, start_time: newStart, end_time: newEnd };
      }
      return ev.id === updatedEvent.id ? updatedEvent : ev;
    }));
  };

  const removeEventLocally = (eventId, deleteSeries = false) => {
    setLocalEvents(prev => {
      const eventToDelete = prev.find(e => e.id === eventId);
      if (deleteSeries && eventToDelete?.series_id) {
        return prev.filter(ev => ev.series_id !== eventToDelete.series_id);
      }
      return prev.filter(ev => ev.id !== eventId);
    });
  };

  const saveAllChanges = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); 
      setEvents(localEvents);
      showToast('הלו"ז נשמר בהצלחה', 'success');
    } catch (e) {
      showToast('שגיאה בשמירה', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateWeek = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  const jumpToToday = () => setCurrentDate(new Date());

  return (
    <ScheduleContext.Provider value={{
      currentDate,
      events: localEvents, 
      isLoading,
      error,
      selectedUserId,
      setSelectedUserId,
      mockTrainees,
      navigateWeek,
      jumpToToday,
      fetchEvents,
      addEventLocally,
      updateEventLocally,
      removeEventLocally,
      saveAllChanges
    }}>
      {children}
    </ScheduleContext.Provider>
  );
};