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

  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const generalEvents = [
    {
      id: 'general-1',
      title: 'אימון פתוח בפארק',
      event_type: 'other',
      start_time: `${todayStr}T18:00:00`,
      end_time: `${todayStr}T19:30:00`,
      assignment_target: 'group',
      user_id: 'group',
      user_name: 'כל הקבוצה',
      user_picture: 'https://ui-avatars.com/api/?name=Group&background=random'
    },
    {
      id: 'general-2',
      title: 'הרצאת תזונה נכונה',
      event_type: 'study',
      start_time: `${tomorrowStr}T20:00:00`,
      end_time: `${tomorrowStr}T21:00:00`,
      assignment_target: 'group',
      user_id: 'group',
      user_name: 'כל הקבוצה',
      user_picture: 'https://ui-avatars.com/api/?name=Group&background=random'
    }
  ];

  const trainees = [
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
        },
        {
          id: 'mock-3',
          title: 'אימון התאוששות',
          event_type: 'personal',
          start_time: `${yesterdayStr}T18:00:00`,
          end_time: `${yesterdayStr}T19:00:00`,
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
          id: 'mock-4',
          title: 'ריצת שטח',
          event_type: 'personal',
          start_time: `${todayStr}T17:00:00`,
          end_time: `${todayStr}T18:00:00`,
          user_id: 'trainee-2',
          user_name: 'מיכל אהרון',
          user_picture: 'https://picsum.photos/seed/michal/100'
        },
        {
          id: 'mock-5',
          title: 'אימון אינטרוולים',
          event_type: 'template',
          template_id: 'temp-2',
          start_time: `${tomorrowStr}T08:00:00`,
          end_time: `${tomorrowStr}T09:00:00`,
          user_id: 'trainee-2',
          user_name: 'מיכל אהרון',
          user_picture: 'https://picsum.photos/seed/michal/100'
        },
        {
          id: 'mock-6',
          title: 'מתיחות וגמישות',
          event_type: 'personal',
          start_time: `${dayAfterStr}T19:00:00`,
          end_time: `${dayAfterStr}T19:45:00`,
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
      events: [
        {
          id: 'mock-7',
          title: 'פילאטיס',
          event_type: 'study',
          start_time: `${yesterdayStr}T10:00:00`,
          end_time: `${yesterdayStr}T11:00:00`,
          user_id: 'trainee-3',
          user_name: 'רוני כהן',
          user_picture: 'https://picsum.photos/seed/roni/100'
        },
        {
          id: 'mock-8',
          title: 'משקולות מתחילים',
          event_type: 'template',
          template_id: 'temp-3',
          start_time: `${todayStr}T11:00:00`,
          end_time: `${todayStr}T12:00:00`,
          user_id: 'trainee-3',
          user_name: 'רוני כהן',
          user_picture: 'https://picsum.photos/seed/roni/100'
        },
        {
          id: 'mock-9',
          title: 'מבדק אירובי',
          event_type: 'test',
          start_time: `${dayAfterStr}T08:30:00`,
          end_time: `${dayAfterStr}T09:30:00`,
          user_id: 'trainee-3',
          user_name: 'רוני כהן',
          user_picture: 'https://picsum.photos/seed/roni/100'
        }
      ]
    }
  ];

  return { trainees, generalEvents };
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
      const { trainees, generalEvents } = generateMockSchedule();
      setMockTrainees(trainees.map(t => ({ id: t.user_id, name: t.user_name })));

      let fetchedEvents = [];

      if (selectedUserId === 'all') {
        trainees.forEach(trainee => {
          fetchedEvents = [...fetchedEvents, ...trainee.events];
        });
        fetchedEvents = [...fetchedEvents, ...generalEvents];
      } else if (selectedUserId !== user.id) {
        const trainee = trainees.find(t => t.user_id === selectedUserId);
        if (trainee) {
          fetchedEvents = [...trainee.events, ...generalEvents];
        }
      } else {
         fetchedEvents = [...generalEvents];
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
      showToast('Error loading schedule data', 'error');
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
      showToast('Schedule saved successfully', 'success');
    } catch (e) {
      showToast('Error saving schedule', 'error');
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