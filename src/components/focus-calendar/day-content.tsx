import { useSearch } from '@tanstack/react-router';
import React, { TouchEvent, useRef } from 'react';

interface DayContentProps {
  selectedDate: Date;
  onDateChange: (newDate: Date) => void;
}

const DayContent: React.FC<DayContentProps> = () => {
  const search = useSearch({ from: '/' });
  const touchStartX = useRef<number | null>(null);

  // const handleSwipe = (direction: 'left' | 'right') => {
  //   const newDate = new Date(selectedDate);
  //   newDate.setDate(selectedDate.getDate() + (direction === 'left' ? 1 : -1));
  //   onDateChange(newDate);
  // };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    // if (diff > 50) handleSwipe('left');
    // else if (diff < -50) handleSwipe('right');

    touchStartX.current = null;
  };

  return (
    <div
      className="flex-grow rounded-2xl p-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <h2 className="text-xl">Content for {search.date}</h2>
      {/* Add day-specific content here */}
    </div>
  );
};

export default DayContent;
