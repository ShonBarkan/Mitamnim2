import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useSchedule } from '../../contexts/ScheduleContext';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DailyTimeGrid = ({ onSlotClick, onEventClick }) => {
  const { currentDate, events } = useSchedule();
  const navigate = useNavigate();
  const gridRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const START_HOUR = 6;
  const END_HOUR = 23;

  useEffect(() => {
    if (gridRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const boundedHour = Math.max(START_HOUR, Math.min(currentHour, END_HOUR));
      const offsetHours = boundedHour - START_HOUR;
      gridRef.current.scrollTop = (offsetHours - 4) * 64;
    }
  }, [currentDate]); 

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  const weekDates = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return days.map((dayName, index) => {
      const date = new Date(d.setDate(diff + index));
      return { name: dayName, date };
    });
  }, [currentDate]);

  const processOverlaps = (dayEvents) => {
    dayEvents.sort((a, b) => a.start_time - b.start_time);
    const groups = [];
    
    dayEvents.forEach(event => {
      let placed = false;
      for (const group of groups) {
        const groupEnd = new Date(Math.max(...group.map(e => e.end_time)));
        if (event.start_time < groupEnd) {
          group.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) groups.push([event]);
    });

    const positionedEvents = [];
    groups.forEach(group => {
      const width = 100 / group.length;
      group.forEach((event, index) => {
        positionedEvents.push({
          ...event,
          widthStyle: `${width}%`,
          rightStyle: `${index * width}%` 
        });
      });
    });
    return positionedEvents;
  };

  const renderEventBlock = (event) => {
    const startMinutes = event.start_time.getHours() * 60 + event.start_time.getMinutes();
    const durationMinutes = (event.end_time - event.start_time) / 60000;
    
    const topPx = ((startMinutes / 60) - START_HOUR) * 64;
    const heightPx = (durationMinutes / 60) * 64;

    const bgColors = {
      template: 'bg-blue-50 border-blue-400 text-blue-900',
      test: 'bg-red-50 border-red-400 text-red-900',
      personal: 'bg-green-50 border-green-400 text-green-900',
      study: 'bg-orange-50 border-orange-400 text-orange-900',
      other: 'bg-gray-50 border-gray-400 text-gray-900'
    };

    const isTemplate = event.event_type === 'template';

    return (
      <div 
        key={event.id}
        onClick={(e) => { 
          e.stopPropagation(); 
          onEventClick(event); 
        }}
        className={`absolute rounded-xl border-r-4 p-2 text-xs cursor-pointer overflow-hidden transition-all hover:shadow-lg flex flex-col justify-between ${bgColors[event.event_type] || bgColors.other}`}
        style={{
          top: `${topPx}px`,
          height: `${heightPx}px`,
          width: `calc(${event.widthStyle} - 4px)`,
          right: event.rightStyle,
        }}
      >
        <div className="flex justify-between items-start">
            <div className="font-black truncate w-full">
               {!isTemplate && event.title}
               {event.user_name && <div className="text-[9px] font-medium opacity-70 truncate">{event.user_name}</div>}
            </div>
            {event.user_picture && (
                <img src={event.user_picture} alt="user" className="w-6 h-6 rounded-full border border-white shadow-sm shrink-0 ml-1" />
            )}
        </div>

        {isTemplate ? (
            <button 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    if (event.template_id) navigate(`/active-workout/${event.template_id}`);
                }}
                className="mt-2 flex items-center justify-center w-full gap-1 bg-blue-600 text-white py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition active:scale-95"
            >
                <Play size={10} /> התחל אימון
            </button>
        ) : (
            <div className="mt-1 text-[10px] opacity-70 font-bold truncate flex justify-between items-end">
              <span>{event.start_time.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</span>
              {event.series_id && <span className="opacity-50 text-[8px]">↻</span>}
            </div>
        )}
      </div>
    );
  };

  const currentTimePosition = ((currentTime.getHours() - START_HOUR) * 64) + (currentTime.getMinutes() / 60 * 64);
  const isCurrentTimeVisible = currentTime.getHours() >= START_HOUR && currentTime.getHours() <= END_HOUR;

  return (
    <div className="flex flex-col min-w-[800px] h-full overflow-hidden">
      <div className="flex border-b bg-white sticky top-0 z-20">
        <div className="w-16 border-l shrink-0"></div>
        {weekDates.map(({ name, date }, i) => (
          <div key={i} className="flex-1 text-center py-2 border-l last:border-l-0">
            <div className="text-sm text-gray-500">{name}</div>
            <div className={`text-xl font-medium ${date.toDateString() === new Date().toDateString() ? 'text-blue-600 bg-blue-50 rounded-full w-8 h-8 mx-auto flex items-center justify-center' : 'text-gray-900'}`}>
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>

      <div ref={gridRef} className="flex relative bg-white overflow-y-auto h-full scroll-smooth">
        <div className="w-16 border-l shrink-0 bg-gray-50 z-10">
          {hours.map(hour => (
            <div key={hour} className="h-16 text-xs text-gray-400 text-center relative -top-3">
              {`${hour.toString().padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {weekDates.map(({ date }, i) => {
          const dayEvents = events.filter(e => e.start_time.toDateString() === date.toDateString());
          const positionedEvents = processOverlaps(dayEvents);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div key={i} className="flex-1 border-l last:border-l-0 relative group">
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="h-16 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    const slotDate = new Date(date);
                    slotDate.setHours(hour, 0, 0, 0);
                    onSlotClick(slotDate);
                  }}
                ></div>
              ))}
              
              {isToday && isCurrentTimeVisible && (
                  <div 
                    className="absolute w-full border-t-2 border-red-500 z-30 pointer-events-none flex items-center shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    style={{ top: `${currentTimePosition}px` }}
                  >
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -mr-1 shadow-sm"></div>
                  </div>
              )}

              <div className="absolute inset-0 pointer-events-none">
                <div className="relative h-full w-full pointer-events-auto px-1">
                  {positionedEvents.map(renderEventBlock)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyTimeGrid;
