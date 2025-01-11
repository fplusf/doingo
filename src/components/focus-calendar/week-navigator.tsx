import { cn } from '@/lib/utils';
import { useGesture } from '@use-gesture/react';
import { format, isSameDay } from 'date-fns';
import * as React from 'react';
import { useWeekNavigation } from '../../hooks/use-week-navigation';
import DayChart from './day-chart';

let isTransitioning = false;

function WeekNavigator({ className }: { className?: string }) {
  const { selectedDate, weeks, handleDateSelect, handleNext, handlePrev } = useWeekNavigation();
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGesture(
    {
      onWheel: ({ delta: [dx] }) => {
        if (isTransitioning) return;
        isTransitioning = true;

        if (dx > 0) {
          handleNext();
        } else {
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
        'bg-sidebar-background relative mx-auto h-[104px] w-full overflow-hidden pt-2 text-white [touch-action:none]',
        className,
      )}
    >
      <div className="flex h-full w-full">
        {weeks.map((weekData) => (
          <div key={weekData.id} className="week w-full flex-shrink-0 bg-sidebar">
            <div className="grid w-full grid-cols-7 bg-sidebar">
              {weekData.dates.map((date, i) => (
                <div key={i} onClick={() => handleDateSelect(date)}>
                  <DayChart
                    date={format(date, 'yyyy-MM-dd')}
                    isSelected={isSameDay(date, selectedDate)}
                    isToday={isSameDay(date, new Date())}
                    progress={isSameDay(date, selectedDate) ? 65 : 0}
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
