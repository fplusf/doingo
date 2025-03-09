import type React from 'react';

import type { Event } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  setHours,
  setMinutes,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import EventItem from './event-item';

interface CalendarGridProps {
  view: 'day' | 'week' | 'month' | 'year';
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onTimeSlotClick: (date: Date) => void;
  onDragStart: (event: Event, e: React.MouseEvent) => void;
  onDragEnd: (e: React.MouseEvent, date?: Date) => void;
  isDragging: boolean;
  draggedEvent: Event | null;
}

export default function CalendarGrid({
  view,
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
  onDragStart,
  onDragEnd,
  isDragging,
  draggedEvent,
}: CalendarGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [hoveredTime, setHoveredTime] = useState<Date | null>(null);

  // Scroll to 7 AM on initial render
  useEffect(() => {
    if (gridRef.current && (view === 'day' || view === 'week')) {
      const scrollTo = 7 * 48; // 7 AM (each hour is 48px)
      gridRef.current.scrollTop = scrollTo;
    }
  }, [view]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top + gridRef.current.scrollTop;
      const x = e.clientX - rect.left;

      // Calculate which day column we're in (for week view)
      const dayWidth = rect.width / 7;
      const dayIndex = Math.floor(x / dayWidth);

      // Calculate time based on y position
      const hourHeight = 48; // height of one hour in pixels
      const hour = Math.floor(y / hourHeight);
      const minute = Math.floor((y % hourHeight) / (hourHeight / 4)) * 15;

      let date;
      if (view === 'week') {
        const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
        date = addDays(startDate, dayIndex);
      } else {
        date = currentDate;
      }

      date = setHours(date, hour);
      date = setMinutes(date, minute);

      setHoveredTime(date);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    onDragEnd(e, hoveredTime || undefined);
    setHoveredTime(null);
  };

  if (view === 'day') {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div
        ref={gridRef}
        className="h-[calc(100vh-128px)] overflow-y-auto"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="relative grid min-h-[1152px] grid-cols-1">
          <div className="absolute left-0 top-0 z-10 h-full w-16 border-r border-[#3c4043]">
            {hours.map((hour) => (
              <div key={hour} className="-mt-2.5 h-12 pr-2 text-right text-xs text-[#e8eaed]">
                {hour === 0
                  ? ''
                  : `${hour % 12 === 0 ? 12 : hour % 12} ${hour >= 12 ? 'PM' : 'AM'}`}
              </div>
            ))}
          </div>

          <div className="ml-16">
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative h-12 border-t border-[#3c4043]"
                onClick={() => {
                  const date = new Date(currentDate);
                  date.setHours(hour, 0, 0, 0);
                  onTimeSlotClick(date);
                }}
              >
                {/* Events that fall within this hour */}
                {events
                  .filter((event) => {
                    const eventHour = event.start.getHours();
                    return isSameDay(event.start, currentDate) && eventHour === hour;
                  })
                  .map((event) => (
                    <EventItem
                      key={event.id}
                      event={event}
                      onClick={() => onEventClick(event)}
                      onDragStart={(e) => onDragStart(event, e)}
                      isDragging={isDragging && draggedEvent?.id === event.id}
                    />
                  ))}
              </div>
            ))}
          </div>

          {/* Current time indicator */}
          <div
            className="absolute left-0 right-0 z-20 border-t border-red-500"
            style={{
              top: `${new Date().getHours() * 48 + new Date().getMinutes() * 0.8}px`,
            }}
          >
            <div className="-ml-1 -mt-1.5 h-2.5 w-2.5 rounded-full bg-red-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'week') {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div
        ref={gridRef}
        className="h-[calc(100vh-128px)] overflow-y-auto"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="relative grid min-h-[1152px] grid-cols-7">
          <div className="absolute left-0 top-0 z-10 h-full w-16 border-r border-[#3c4043]">
            {hours.map((hour) => (
              <div key={hour} className="-mt-2.5 h-12 pr-2 text-right text-xs text-[#e8eaed]">
                {hour === 0
                  ? ''
                  : `${hour % 12 === 0 ? 12 : hour % 12} ${hour >= 12 ? 'PM' : 'AM'}`}
              </div>
            ))}
          </div>

          <div className="col-span-7 ml-16 grid grid-cols-7">
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="border-l border-[#3c4043] first:border-l-0">
                {hours.map((hour) => (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className="relative h-12 border-t border-[#3c4043]"
                    onClick={() => {
                      const date = new Date(day);
                      date.setHours(hour, 0, 0, 0);
                      onTimeSlotClick(date);
                    }}
                  >
                    {/* Events that fall within this hour and day */}
                    {events
                      .filter((event) => {
                        const eventHour = event.start.getHours();
                        return isSameDay(event.start, day) && eventHour === hour;
                      })
                      .map((event) => (
                        <EventItem
                          key={event.id}
                          event={event}
                          onClick={() => onEventClick(event)}
                          onDragStart={(e) => onDragStart(event, e)}
                          isDragging={isDragging && draggedEvent?.id === event.id}
                        />
                      ))}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Current time indicator (only show for current day) */}
          {days.map(
            (day, dayIndex) =>
              isSameDay(day, new Date()) && (
                <div
                  key={`time-${dayIndex}`}
                  className="absolute z-20 border-t border-red-500"
                  style={{
                    top: `${new Date().getHours() * 48 + new Date().getMinutes() * 0.8}px`,
                    left: `${(dayIndex / 7) * 100 + 64}px`,
                    width: `${100 / 7}%`,
                  }}
                >
                  <div className="-ml-1 -mt-1.5 h-2.5 w-2.5 rounded-full bg-red-500"></div>
                </div>
              ),
          )}
        </div>
      </div>
    );
  }

  if (view === 'month') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Group days into weeks
    const weeks = [];
    let week = [];

    for (let i = 0; i < days.length; i++) {
      week.push(days[i]);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    return (
      <div className="h-[calc(100vh-128px)] overflow-y-auto">
        <div className="grid h-full grid-cols-7">
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={cn(
                  'min-h-[120px] border-b border-r border-[#3c4043] p-2',
                  !isSameMonth(day, currentDate) && 'bg-[#2d2e30] text-[#9aa0a6]',
                )}
                onClick={() => onTimeSlotClick(day)}
              >
                <div
                  className={cn(
                    'mb-2 text-sm font-medium',
                    isSameDay(day, new Date()) &&
                      'flex h-6 w-6 items-center justify-center rounded-full bg-[#1a73e8] text-white',
                  )}
                >
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {events
                    .filter((event) => isSameDay(event.start, day))
                    .slice(0, 3) // Limit to 3 events per day
                    .map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          'cursor-pointer truncate rounded p-1 text-xs',
                          event.color || 'bg-[#1a73e8]',
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        {event.title}
                      </div>
                    ))}

                  {events.filter((event) => isSameDay(event.start, day)).length > 3 && (
                    <div className="text-xs text-[#9aa0a6]">
                      +{events.filter((event) => isSameDay(event.start, day)).length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )),
          )}
        </div>
      </div>
    );
  }

  // Year view
  const months = Array.from({ length: 12 }, (_, i) => new Date(currentDate.getFullYear(), i, 1));

  return (
    <div className="h-[calc(100vh-128px)] overflow-y-auto">
      <div className="grid grid-cols-3 gap-4 p-4">
        {months.map((month, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-[#3c4043]">
            <div className="border-b border-[#3c4043] bg-[#2d2e30] p-2 font-medium">
              {format(month, 'MMMM')}
            </div>
            <div className="grid grid-cols-7 p-2 text-center text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="flex h-6 items-center justify-center text-[#9aa0a6]">
                  {day}
                </div>
              ))}

              {getMonthDays(month).map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center',
                    !day && 'invisible',
                    day && isSameDay(day, new Date()) && 'rounded-full bg-[#1a73e8] text-white',
                    day && !isSameMonth(day, month) && 'text-[#5f6368]',
                  )}
                  onClick={() => day && onTimeSlotClick(day)}
                >
                  {day ? format(day, 'd') : ''}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getMonthDays(month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Ensure we have exactly 42 cells (6 weeks)
  const result = Array(42).fill(null);
  days.forEach((day, i) => {
    if (i < 42) {
      result[i] = day;
    }
  });

  return result;
}
