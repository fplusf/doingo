import { cn } from '@/lib/utils';

type TimelineHourItem = {
  type: 'hour';
  minutes: number;
  time: string;
};

type TimelineSkipItem = {
  type: 'skip';
  startMinutes: number;
  endMinutes: number;
};

type TimelineItem = TimelineHourItem | TimelineSkipItem;

export interface TimelineProps {
  startTime?: string; // Format: "HH:MM"
  endTime?: string; // Format: "HH:MM"
  skipRanges?: Array<{
    start: string; // Format: "HH:MM"
    end: string; // Format: "HH:MM"
  }>;
  className?: string;
  hourHeight?: number; // Height in pixels for each hour
  lineWidth?: number; // Width of the horizontal lines in pixels
}

export function DayTimeline({
  startTime = '07:00',
  endTime = '22:00',
  skipRanges = [],
  className,
  hourHeight = 60,
  lineWidth = 40,
}: TimelineProps) {
  // Parse start and end times
  const parseTime = (timeStr: string): { hours: number; minutes: number } => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  };

  const start = parseTime(startTime);
  const end = parseTime(endTime);

  // Calculate total minutes for a time
  const timeToMinutes = (time: { hours: number; minutes: number }): number => {
    return time.hours * 60 + time.minutes;
  };

  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  // Format time for display
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Process skip ranges
  const processedSkipRanges = skipRanges.map((range) => ({
    startMinutes: timeToMinutes(parseTime(range.start)),
    endMinutes: timeToMinutes(parseTime(range.end)),
  }));

  // Generate timeline items
  const generateTimelineItems = (): TimelineItem[] => {
    const items: TimelineItem[] = [];
    let currentMinutes = startMinutes;

    while (currentMinutes <= endMinutes) {
      // Check if current time is in a skip range
      const skipRange = processedSkipRanges.find(
        (range) => currentMinutes >= range.startMinutes && currentMinutes < range.endMinutes,
      );

      if (skipRange) {
        // Add skip indicator
        items.push({
          type: 'skip',
          startMinutes: currentMinutes,
          endMinutes: skipRange.endMinutes,
        });
        currentMinutes = skipRange.endMinutes;
      } else {
        // Add regular hour marker if minutes are 0
        if (currentMinutes % 60 === 0) {
          items.push({
            type: 'hour',
            minutes: currentMinutes,
            time: formatTime(currentMinutes),
          });
        }
        currentMinutes += 60;
      }
    }

    return items;
  };

  const timelineItems = generateTimelineItems();

  return (
    <div
      className={cn('w-100 relative flex flex-col text-gray-300', className)}
      style={{ minHeight: `${hourHeight * Math.ceil((endMinutes - startMinutes) / 60)}px` }}
    >
      {timelineItems.map((item, index) => {
        if (item.type === 'hour') {
          return (
            <div
              key={index}
              className="relative flex items-center"
              style={{ height: `${hourHeight}px` }}
            >
              <div className="flex items-center">
                <div className="h-px bg-gray-600" style={{ width: `${lineWidth}px` }}></div>
                <span className="ml-2 text-sm font-medium">{item.time}</span>
              </div>
            </div>
          );
        } else if (item.type === 'skip') {
          const skipDuration = (item.endMinutes - item.startMinutes) / 60; // Duration in hours
          const skipHeight = Math.min(skipDuration * 20, 60); // Cap the height at 60px
          const numberOfLines = Math.max(1, Math.min(Math.ceil(skipDuration), 5)); // Show 1-5 lines based on duration

          return (
            <div
              key={index}
              className="relative flex flex-col items-start justify-center"
              style={{ height: `${skipHeight}px` }}
            >
              <div className="flex items-center">
                <div className="flex flex-col gap-3">
                  {[...Array(numberOfLines)].map((_, i) => (
                    <div key={i} className="h-px w-8 bg-gray-700"></div>
                  ))}
                </div>
                <span className="ml-2 text-[10px] font-medium text-gray-600">Free Slot</span>
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
