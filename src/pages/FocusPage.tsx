import { useState } from 'react';
import DayContent from '../components/focus-calendar/day-content';
import { WeekNavigator } from '../components/focus-calendar/week-navigator';

export default function FocusPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-gray-900 text-white">
      {/* Week Navigator */}
      <WeekNavigator onDateSelect={handleDateChange} />

      {/* Day Content */}
      <DayContent selectedDate={selectedDate} onDateChange={handleDateChange} />
    </div>
  );
}
