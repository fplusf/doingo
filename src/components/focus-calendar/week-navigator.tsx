import { gsap } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useGesture } from '@use-gesture/react';
import { addDays, addWeeks, format, isSameDay, parse, startOfWeek } from 'date-fns';
import * as React from 'react';
import { FocusRoute } from '../../routes/routes';
import DayChart from './day-chart';

const DATE_FORMAT = 'yyyy-MM-dd';

interface WeekData {
  id: string;
  dates: Date[];
}

function createWeekData(startDate: Date): WeekData {
  return {
    id: format(startDate, DATE_FORMAT),
    dates: Array.from({ length: 7 }).map((_, i) => addDays(startDate, i)),
  };
}

export function WeekNavigator({
  className,
  onDateSelect,
}: {
  className?: string;
  onDateSelect: (date: Date) => void;
}) {
  const [currentIndex, setCurrentIndex] = React.useState(2); // initial middle position
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const search = useSearch({ from: '/' });
  const navigate = useNavigate({ from: FocusRoute.fullPath });
  const today = new Date();
  const selectedDate = React.useMemo(
    () => (search.date ? parse(search.date, DATE_FORMAT, today) : today),
    [search.date],
  );

  const [weeks, setWeeks] = React.useState(() => {
    const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 5 }).map((_, offset) => {
      const weekStart = addWeeks(currentWeekStart, offset - 2); // offset - 2 puts current week in center
      return createWeekData(weekStart);
    });
  });

  const weekContainerRef = React.useRef<HTMLDivElement>(null);
  const weekRef = React.useRef<HTMLDivElement>(null);
  const handleNext = React.useCallback(() => {
    setWeeks((current) => {
      const lastWeek = current[current.length - 1];
      const newWeeks = [
        ...current.slice(1),
        createWeekData(addWeeks(startOfWeek(lastWeek.dates[0]), 1)),
      ];
      return newWeeks;
    });

    gsap.fromTo(
      '.week',
      { xPercent: 0 },
      {
        xPercent: '-=100',
        duration: 0.4,
        ease: 'power1.inOut',
        onComplete: () => {
          // TODO: To solve the long wheel events issue, as a last resort we can clone the container and replace it
          // and then attach / hydrate the events again to the new container element
          // const weeksContainer = containerRef.current;
          // const newWeeksContainer = weeksContainer?.cloneNode(true);
          // if (!weeksContainer || !newWeeksContainer) return;
          // weeksContainer?.parentNode?.replaceChild(newWeeksContainer, weeksContainer);
          // SOMEHOW, hydrate the new container with the events here?
        },
      },
    );
    setCurrentIndex(2); // Reset to middle position
  }, []);

  const handlePrev = React.useCallback(() => {
    setWeeks((current) => {
      const firstWeek = current[0];
      const newWeeks = [
        createWeekData(addWeeks(startOfWeek(firstWeek.dates[0]), -1)),
        ...current.slice(0, -1),
      ];
      return newWeeks;
    });

    gsap.fromTo(
      '.week',
      { xPercent: -200 },
      {
        xPercent: -100,
        duration: 0.4,
        ease: 'power1.inOut',
      },
    );
    setCurrentIndex(2); // Reset to middle position
  }, []);

  const handleDateSelect = React.useCallback(
    (date: Date) => {
      navigate({
        search: (prev) => ({
          ...prev,
          date: format(date, DATE_FORMAT),
        }),
      });
      onDateSelect(date);
    },
    [navigate, onDateSelect],
  );

  useGesture(
    {
      onDragEnd: ({ direction: [xDir] }) => {
        if (isTransitioning) return;
        if (xDir < 0) {
          handleNext();
        } else if (xDir > 0) {
          handlePrev();
        }
      },
      onWheel: ({ delta: [dx] }) => {
        if (isTransitioning) return;

        if (dx > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      },
      onWheelStart: ({ delta: [dx] }) => {
        setIsTransitioning(true);
      },
      onTouchEnd: () => setIsTransitioning(false),
      onWheelEnd: () => setIsTransitioning(false),
    },
    { target: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className={cn('relative mx-auto h-[104px] w-full overflow-hidden pt-2 text-white', className)}
    >
      <div ref={weekContainerRef} className="flex h-full w-full">
        {weeks.map((weekData, index) => (
          <div
            ref={weekRef}
            key={weekData.id}
            className={cn(
              'week w-full flex-shrink-0',
              // TODO: it's a bit janky, need to fix
              // why we see the pre-pre week over the current week?
              index === currentIndex ? 'bg-background' : 'bg-background',
            )}
          >
            <div className="grid w-full grid-cols-7">
              {weekData.dates.map((date, i) => (
                <div key={i} onClick={() => handleDateSelect(date)}>
                  <DayChart
                    date={format(date, 'yyyy-MM-dd')}
                    isSelected={isSameDay(date, selectedDate)}
                    isToday={isSameDay(date, today)}
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
