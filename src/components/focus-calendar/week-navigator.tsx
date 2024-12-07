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

export function WeekNavigator({ className }: { className?: string }) {
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const search = useSearch({ from: '/' });
  const navigate = useNavigate({ from: FocusRoute.fullPath });
  const today = new Date();

  const [selectedDate, setSelectedDate] = React.useState(() =>
    search.date ? parse(search.date, DATE_FORMAT, today) : today,
  );

  const [weeks, setWeeks] = React.useState(() => {
    const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 3 }).map((_, offset) => {
      const weekStart = addWeeks(currentWeekStart, offset - 1);
      return createWeekData(weekStart);
    });
  });

  const weekContainerRef = React.useRef<HTMLDivElement>(null);
  const weekRef = React.useRef<HTMLDivElement>(null);

  // Initialize with today's date immediately if no date in URL
  React.useEffect(() => {
    gsap.set('.week', { xPercent: -100 });

    navigate({
      search: (prev) => ({
        ...prev,
        date: format(today, DATE_FORMAT),
      }),
    });
  }, []);

  const handleDateSelect = React.useCallback(
    (date: Date) => {
      setSelectedDate(date);

      navigate({
        search: (prev) => ({
          ...prev,
          date: format(date, DATE_FORMAT),
        }),
      });
    },
    [search.date],
  );

  const handleNext = React.useCallback(() => {
    const nextDate = addWeeks(selectedDate, 1);
    setSelectedDate(nextDate);
    navigate({
      search: (prev) => ({
        ...prev,
        date: format(nextDate, DATE_FORMAT),
      }),
    });

    gsap.fromTo(
      '.week',
      { xPercent: 0 },
      {
        xPercent: '-=100',
        duration: 0.4,
        ease: 'power1.inOut',
      },
    );
  }, [selectedDate, navigate]);

  const handlePrev = React.useCallback(() => {
    const prevDate = addWeeks(selectedDate, -1);
    setSelectedDate(prevDate);
    navigate({
      search: (prev) => ({
        ...prev,
        date: format(prevDate, DATE_FORMAT),
      }),
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
  }, [selectedDate, navigate]);

  // Update weeks when selectedDate changes
  React.useEffect(() => {
    const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    setWeeks(
      Array.from({ length: 3 }).map((_, offset) => {
        const weekStart = addWeeks(currentWeekStart, offset - 1);
        return createWeekData(weekStart);
      }),
    );
  }, [selectedDate]);

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
      className={cn(
        'relative mx-auto h-[104px] w-full overflow-hidden pt-2 text-white [touch-action:none]',
        className,
      )}
    >
      <div ref={weekContainerRef} className="flex h-full w-full">
        {weeks.map((weekData) => (
          <div ref={weekRef} key={weekData.id} className="week w-full flex-shrink-0 bg-background">
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
