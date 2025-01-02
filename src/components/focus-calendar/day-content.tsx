import { useSearch } from '@tanstack/react-router';
import React, { TouchEvent, useRef } from 'react';
import { FocusRoute } from '../../routes/routes';
import { CustomTimeline, CustomTimelineItem } from '../timeline/timeline';

interface DayContentProps {}

const DayContent: React.FC<DayContentProps> = () => {
  const search = useSearch({ from: FocusRoute.fullPath });
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    touchStartX.current = null;
  };

  return (
    <div
      className="mx-auto h-[calc(100vh-200px)] w-full max-w-[1200px] flex-grow overflow-y-auto rounded-2xl pb-20 pl-6 pr-16"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <CustomTimeline>
        <CustomTimelineItem
          dotColor="#FB7185"
          time="10:00"
          startTime={new Date('2024-01-01T10:00:00')}
          nextStartTime={new Date('2024-01-01T10:20:00')}
        >
          <h3 className="font-medium">Rise and Shine</h3>
        </CustomTimelineItem>

        <CustomTimelineItem
          dotColor="#22C55E"
          time="10:00—10:20 (20 min)"
          startTime={new Date('2024-01-01T10:00:00')}
          completed={true}
          strikethrough={true}
          nextStartTime={new Date('2024-01-01T10:20:00')}
        >
          <h3 className="font-medium">Daily Meditation</h3>
        </CustomTimelineItem>

        <CustomTimelineItem
          dotColor="#FB923C"
          time="10:20—10:35 (15 min)"
          startTime={new Date('2024-01-01T10:20:00')}
          completed={true}
          strikethrough={true}
          nextStartTime={new Date('2024-01-01T10:35:00')}
        >
          <h3 className="font-medium">Add</h3>
        </CustomTimelineItem>

        <CustomTimelineItem
          dotColor="#22C55E"
          time="10:45—11:00 (15 min)"
          completed={true}
          strikethrough={true}
          startTime={new Date('2024-01-01T10:45:00')}
          nextStartTime={new Date('2024-01-01T11:00:00')}
        >
          <h3 className="font-medium">Add</h3>
        </CustomTimelineItem>

        <CustomTimelineItem
          dotColor="#374151"
          time="13:05-21:00 (7h 55m)"
          startTime={new Date('2024-01-01T13:05:00')}
          nextStartTime={new Date('2024-01-01T21:00:00')}
        >
          <h3 className="font-medium">Am I conscious of myself right now?</h3>
        </CustomTimelineItem>

        <CustomTimelineItem
          dotColor="#374151"
          time="21:00—22:00 (60 min)"
          startTime={new Date('2024-01-01T21:00:00')}
          nextStartTime={new Date('2024-01-01T22:00:00')}
        >
          <h3 className="font-medium">Canceled: Monthly Rotation Handover & Sync</h3>
        </CustomTimelineItem>

        <CustomTimelineItem
          dotColor="#3B82F6"
          time="01:00"
          startTime={new Date('2024-01-01T22:00:00')}
          nextStartTime={new Date('2024-01-01T23:00:00')}
        >
          <h3 className="font-medium">Wind Down</h3>
        </CustomTimelineItem>
      </CustomTimeline>
    </div>
  );
};

export default DayContent;
