import React, { useMemo } from 'react';
import { useSchedule } from '../../contexts/ScheduleContext';

const DailyTimeGrid = ({ onSlotClick, onEventClick }) => {
  const { currentDate, events } = useSchedule();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  // Calculate current week dates
  const weekDates = useMemo(() => {
    const d = new Date(currentDate);
    const diff = d.getDate() - d.getDay();
    return days.map((dayName, index) => {
      const date = new Date(d.setDate(diff + index));
      return { name: dayName, date };
    });
  }, [currentDate]);

  // Google Calendar style overlap calculation algorithm
  const processOverlaps = (dayEvents) => {
    dayEvents.sort((a, b) => a.start_time - b.start_time);
    const groups = [];
    
    dayEvents.forEach(event => {
      let placed = false;
      for (const group of groups) {
        // Check if event overlaps with the current group
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
          rightStyle: `${index * width}%` // Using rightStyle for RTL layout positioning
        });
      });
    });
    return positionedEvents;
  };

  const renderEventBlock = (event) => {
    const startMinutes = event.start_time.getHours() * 60 + event.start_time.getMinutes();
    const durationMinutes = (event.end_time - event.start_time) / 60000;
    
    const topPx = (startMinutes / 60) * 64; // Assuming 64px per hour slot
    const heightPx = (durationMinutes / 60) * 64;

    const bgColors = {
      template: 'bg-blue-100 border-blue-400 text-blue-800',
      test: 'bg-red-100 border-red-400 text-red-800',
      personal: 'bg-green-100 border-green-400 text-green-800',
      other: 'bg-gray-100 border-gray-400 text-gray-800'
    };

    return (
      <div 
        key={event.id}
        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
        className={`absolute rounded-md border-r-4 p-1 text-xs cursor-pointer overflow-hidden transition hover:shadow-md ${bgColors[event.event_type]}`}
        style={{
          top: `${topPx}px`,
          height: `${heightPx}px`,
          width: `calc(${event.widthStyle} - 2px)`,
          right: event.rightStyle,
        }}
      >
        <div className="font-semibold truncate">{event.title}</div>
        <div className="text-[10px] opacity-80">
          {event.start_time.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})} - 
          {event.end_time.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-w-[800px]">
      {/* Grid Header */}
      <div className="flex border-b bg-white sticky top-0 z-10">
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

      {/* Grid Body */}
      <div className="flex relative bg-white">
        {/* Time Labels */}
        <div className="w-16 border-l shrink-0 bg-gray-50 z-10">
          {hours.map(hour => (
            <div key={hour} className="h-16 text-xs text-gray-400 text-center relative -top-3">
              {`${hour.toString().padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {/* Days Columns */}
        {weekDates.map(({ date }, i) => {
          const dayEvents = events.filter(e => e.start_time.toDateString() === date.toDateString());
          const positionedEvents = processOverlaps(dayEvents);

          return (
            <div key={i} className="flex-1 border-l last:border-l-0 relative group">
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="h-16 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => {
                    const slotDate = new Date(date);
                    slotDate.setHours(hour, 0, 0, 0);
                    onSlotClick(slotDate);
                  }}
                ></div>
              ))}
              {/* Render Events */}
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