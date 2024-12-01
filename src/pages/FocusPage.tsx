import { useState } from 'react';
import DayContent from '../components/focus-calendar/day-content';
import { WeekNavigator } from '../components/focus-calendar/week-navigator';
import { useSidebar } from '../components/ui/sidebar';
import { cn } from '../lib/utils';

export default function FocusPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const sidebar = useSidebar();

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  return (
    <div
      className={cn(
        'flex h-full transition-all duration-100',
        sidebar.open ? 'w-[calc(100vw-6rem)]' : 'w-[calc(100vw-2rem)]',
        'flex-col text-white',
      )}
    >
      {/* Week Navigator */}
      <WeekNavigator onDateSelect={handleDateChange} className="rounded-t-2xl" />

      {/* Day Content */}
      <DayContent selectedDate={selectedDate} onDateChange={handleDateChange} />
    </div>
  );
}
