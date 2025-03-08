import { useWeekNavigation } from '@/features/tasks/hooks/use-week-navigation';
import { cn } from '@/lib/utils';
import { useGesture } from '@use-gesture/react';
import { format, isSameDay } from 'date-fns';
import * as React from 'react';
import { useTasksProgress } from '../../hooks/use-tasks-progress';
import { DayChart } from './day-chart';

let isTransitioning = false;

export function WeekNavigator({ className }: { className?: string }) {
  const { selectedDate, weeks, handleDateSelect, handleNext, handlePrev } = useWeekNavigation();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { getProgressForDate } = useTasksProgress();

  useGesture(
    {
      onWheel: ({ delta: [dx, dy], direction: [dirX] }) => {
        // Ignore if vertical scroll is more significant than horizontal
        if (Math.abs(dy) > Math.abs(dx)) return;
        if (isTransitioning) return;
        isTransitioning = true;

        // Only respond to horizontal gestures
        if (dirX > 0) {
          handleNext();
        } else if (dirX < 0) {
          handlePrev();
        }
      },
      onWheelEnd: () => {
        isTransitioning = false;
      },
    },
    { target: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative mx-auto h-[90px] w-full overflow-hidden bg-background pt-2 text-white',
        className,
      )}
    >
      <div className="flex h-full w-full">
        {weeks.map((weekData) => (
          <div key={weekData.id} className="week w-full flex-shrink-0 bg-background">
            <div className="grid w-full grid-cols-7">
              {weekData.dates.map((date, i) => (
                <div key={i} onClick={() => handleDateSelect(date)}>
                  <DayChart
                    date={format(date, 'yyyy-MM-dd')}
                    isSelected={isSameDay(date, selectedDate)}
                    isToday={isSameDay(date, new Date())}
                    progress={getProgressForDate(format(date, 'yyyy-MM-dd'))}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default React.memo(WeekNavigator);
