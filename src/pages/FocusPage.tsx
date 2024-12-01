import { useState } from 'react';
import DayContent from '../components/focus-calendar/day-content';
import { WeekNavigator } from '../components/focus-calendar/week-navigator';
import { useSidebar } from '../components/ui/sidebar';

export default function FocusPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const sidebar = useSidebar();

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  return (
    <div
      className={`flex h-screen ${sidebar.open ? 'w-[calc(100vw-5rem)]' : 'w-screen'} flex-col text-white`}
    >
      {/* Week Navigator */}
      <WeekNavigator onDateSelect={handleDateChange} />

      {/* Day Content */}
      <DayContent selectedDate={selectedDate} onDateChange={handleDateChange} />
    </div>
  );
}
