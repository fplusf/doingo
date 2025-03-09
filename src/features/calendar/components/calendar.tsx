import { addDays, addMinutes, addMonths, format, subMonths } from 'date-fns';
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Menu,
  Plus,
  Search,
  Settings,
  User,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import { generateSampleEvents } from '@/lib/sample-data';
import type { Event } from '@/lib/types';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

import CalendarGrid from './calendar-grid';
import CalendarHeader from './calendar-header';
import EventModal from './event-modal';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [events, setEvents] = useState<Event[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const dragStartPosition = useRef({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    // Load sample events on initial render
    setEvents(generateSampleEvents(new Date()));

    // Update current time indicator every minute
    const interval = setInterval(() => {
      // Force re-render to update current time indicator
      setCurrentDate((prev) => new Date(prev.getTime()));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handlePrevious = () => {
    if (view === 'day') {
      setCurrentDate((prev) => addDays(prev, -1));
    } else if (view === 'week') {
      setCurrentDate((prev) => addDays(prev, -7));
    } else if (view === 'month') {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else if (view === 'year') {
      setCurrentDate((prev) => addMonths(prev, -12));
    }
  };

  const handleNext = () => {
    if (view === 'day') {
      setCurrentDate((prev) => addDays(prev, 1));
    } else if (view === 'week') {
      setCurrentDate((prev) => addDays(prev, 7));
    } else if (view === 'month') {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else if (view === 'year') {
      setCurrentDate((prev) => addMonths(prev, 12));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateEvent = (event: Event) => {
    if (selectedEvent) {
      // Update existing event
      setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? event : e)));
    } else {
      // Create new event
      setEvents((prev) => [...prev, { ...event, id: crypto.randomUUID() }]);
    }
    setIsEventModalOpen(false);
    setSelectedEvent(null);
    setSelectedSlot(null);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleTimeSlotClick = (date: Date) => {
    setSelectedSlot(date);
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const handleDragStart = (event: Event, e: React.MouseEvent) => {
    setIsDragging(true);
    setDraggedEvent(event);
    dragStartPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleDragEnd = (e: React.MouseEvent, date?: Date) => {
    if (isDragging && draggedEvent && date) {
      // Calculate time difference based on drag position
      const yDiff = e.clientY - dragStartPosition.current.y;
      const minutesDiff = Math.round(yDiff / 20) * 15; // Snap to 15-minute intervals

      const newStart = date ? date : draggedEvent.start;
      const duration = draggedEvent.end.getTime() - draggedEvent.start.getTime();

      const updatedEvent = {
        ...draggedEvent,
        start: addMinutes(newStart, minutesDiff),
        end: addMinutes(newStart, minutesDiff + duration / 60000),
      };

      setEvents((prev) => prev.map((e) => (e.id === draggedEvent.id ? updatedEvent : e)));
    }

    setIsDragging(false);
    setDraggedEvent(null);
  };

  const handleEventResize = (event: Event, newDuration: number) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === event.id) {
          return {
            ...e,
            end: addMinutes(e.start, newDuration),
          };
        }
        return e;
      }),
    );
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 items-center border-b border-[#3c4043] px-4">
        <Button variant="ghost" size="icon" className="mr-2">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="mr-8 flex items-center">
          <CalendarIcon className="mr-2 h-6 w-6 text-[#8ab4f8]" />
          <span className="text-xl font-medium">Calendar</span>
        </div>

        <Button
          variant="outline"
          className="mr-4 border-[#5f6368] bg-transparent text-white hover:bg-[#3c4043]"
          onClick={handleToday}
        >
          Today
        </Button>

        <Button variant="ghost" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" onClick={handleNext}>
          <ChevronRight className="h-5 w-5" />
        </Button>

        <h2 className="ml-4 text-xl font-medium">
          {format(currentDate, view === 'year' ? 'yyyy' : 'MMMM yyyy')}
        </h2>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="ml-4 border-[#5f6368] bg-transparent text-white hover:bg-[#3c4043]"
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
                <ChevronLeft className="rotate-270 ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-[#5f6368] bg-[#2d2e30] text-white">
              <DropdownMenuItem onClick={() => setView('day')}>Day</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView('week')}>Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView('month')}>Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView('year')}>Year</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-4 flex gap-1">
            <Button
              variant="outline"
              className="border-[#5f6368] bg-transparent p-2 hover:bg-[#3c4043]"
            >
              <CalendarIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              className="border-[#5f6368] bg-transparent p-2 hover:bg-[#3c4043]"
              onClick={() => {
                setSelectedSlot(new Date());
                setSelectedEvent(null);
                setIsEventModalOpen(true);
              }}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="ml-2 overflow-hidden rounded-full">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8ab4f8]">
              <User className="h-5 w-5 text-[#202124]" />
            </div>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <CalendarHeader view={view} currentDate={currentDate} />
        <CalendarGrid
          view={view}
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
          onTimeSlotClick={handleTimeSlotClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          isDragging={isDragging}
          draggedEvent={draggedEvent}
          onEventResize={handleEventResize}
        />
      </div>

      <Button
        className="absolute bottom-8 left-8 h-14 w-14 rounded-full bg-white text-[#202124] shadow-lg hover:bg-gray-100"
        onClick={() => {
          setSelectedSlot(new Date());
          setSelectedEvent(null);
          setIsEventModalOpen(true);
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onSave={handleCreateEvent}
          onDelete={handleDeleteEvent}
          event={selectedEvent}
          initialDate={selectedSlot}
        />
      )}
    </div>
  );
}
