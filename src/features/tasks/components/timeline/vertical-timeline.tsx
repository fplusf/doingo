import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import React from 'react';

interface VerticalTimelineProps {
  startTime: Date;
  endTime: Date;
  className?: string;
  onTimeClick?: (time: Date) => void;
}

interface TimeGapProps {
  height: number;
  className?: string;
}

/**
 *  ---- 9:00
 *
 *  ---- 10:00
 *
 *  ---- 11:00
 *
 *  ---- 12:00
 *
 *  ---- 13:00
 *
 *  ---- 14:00
 *
 *  ---- 15:00
 *
 *  ---- 16:00
 *
 *  ---- 17:00
 */

const TimeGap: React.FC<TimeGapProps> = ({ height, className }) => (
  <div
    className={cn(
      'relative flex items-center justify-center py-2',
      'before:absolute before:right-0 before:h-full before:w-[1px] before:border-l before:border-dashed before:border-gray-300/50',
      className,
    )}
    style={{ height: `${height}px` }}
    role="presentation"
  >
    <div className="relative z-10 rounded-full bg-gray-100/10 px-2 text-xs text-gray-400">
      Time gap
    </div>
  </div>
);

export const VerticalTimeline: React.FC<VerticalTimelineProps> = ({
  startTime,
  endTime,
  className,
  onTimeClick,
}) => {
  // Calculate the number of hours between start and end time
  const hoursDiff = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
  const hours = Array.from({ length: hoursDiff }, (_, i) => {
    const date = new Date(startTime);
    date.setHours(startTime.getHours() + i);
    // Set minutes to 0 to show exact hours
    date.setMinutes(0);
    return date;
  });

  // Function to check if there's a significant gap between hours
  const hasSignificantGap = (current: Date, next: Date) => {
    if (!next) return false;
    const diffInHours = (next.getTime() - current.getTime()) / (1000 * 60 * 60);
    return diffInHours > 3;
  };

  return (
    <div
      className={cn('w-16 bg-background/80 backdrop-blur-sm', className)}
      role="complementary"
      aria-label="Time schedule"
    >
      {/* Timeline Container */}
      <div className="relative h-full">
        {hours.map((hour, index) => {
          const nextHour = hours[index + 1];
          const hasGap = hasSignificantGap(hour, nextHour);

          return (
            <React.Fragment key={hour.toISOString()}>
              <div className="relative">
                {/* Hour Block */}
                <div
                  className={cn(
                    'relative h-[100px] select-none',
                    'before:absolute before:right-0 before:h-full before:w-[1px] before:bg-gray-300/20',
                    'after:absolute after:right-0 after:top-1/2 after:h-[1px] after:w-4 after:border-t after:border-dashed after:border-gray-300/30',
                  )}
                  role="presentation"
                >
                  {/* Hour Label */}
                  <div className="absolute -top-3 right-6 select-none whitespace-nowrap text-right text-xs text-gray-400">
                    {format(hour, 'h:mm a')}
                  </div>
                </div>

                {/* Time Gap Indicator */}
                {hasGap && <TimeGap height={50} />}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
