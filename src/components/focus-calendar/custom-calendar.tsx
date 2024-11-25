import { cn } from '@/lib/utils';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { addDays, addWeeks, format, isSameDay, parse, startOfWeek, subWeeks } from 'date-fns';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import * as React from 'react';
import { FocusRoute } from '../../routes/routes';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';

const DATE_FORMAT = 'yyyy-MM-dd';
const WINDOW_SIZE = 5; // Keep 5 weeks in memory: 2 before, current, 2 after
const THRESHOLD_INDEX = 1; // When to shift the window

interface WeekData {
  id: string;
  dates: Date[];
  startDate: Date;
}

function createWeekData(startDate: Date): WeekData {
  return {
    id: format(startDate, DATE_FORMAT),
    dates: Array.from({ length: 7 }).map((_, i) => addDays(startDate, i)),
    startDate,
  };
}

export function Calendar({
  className,
  onDateSelect,
}: {
  className?: string;
  onDateSelect: (date: Date) => void;
}) {
  const search = useSearch({ from: '/' });
  const navigate = useNavigate({ from: FocusRoute.fullPath });
  const [api, setApi] = React.useState<CarouselApi>();

  // Parse selected date from URL or use current date
  const selectedDate = React.useMemo(() => {
    return search.date ? parse(search.date, DATE_FORMAT, new Date()) : new Date();
  }, [search.date]);

  // Keep track of the central date for our window
  const [centerDate, setCenterDate] = React.useState(() =>
    startOfWeek(selectedDate, { weekStartsOn: 1 }),
  );

  // Generate and maintain our sliding window of weeks
  const [weeks, setWeeks] = React.useState<WeekData[]>(() => {
    const center = startOfWeek(centerDate, { weekStartsOn: 1 });
    const start = subWeeks(center, Math.floor(WINDOW_SIZE / 2));

    return Array.from({ length: WINDOW_SIZE }).map((_, i) => createWeekData(addWeeks(start, i)));
  });

  // Handle window sliding
  const slideWindow = React.useCallback((direction: 'forward' | 'backward') => {
    setWeeks((currentWeeks) => {
      const newWeeks = [...currentWeeks];

      if (direction === 'forward') {
        // Remove first week and add a new week at the end
        newWeeks.shift();
        const lastWeek = newWeeks[newWeeks.length - 1];
        newWeeks.push(createWeekData(addWeeks(lastWeek.startDate, 1)));
      } else {
        // Remove last week and add a new week at the start
        newWeeks.pop();
        const firstWeek = newWeeks[0];
        newWeeks.unshift(createWeekData(subWeeks(firstWeek.startDate, 1)));
      }

      return newWeeks;
    });

    // Update center date
    setCenterDate((current) =>
      direction === 'forward' ? addWeeks(current, 1) : subWeeks(current, 1),
    );
  }, []);

  // Handle carousel events
  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const selectedIndex = api.selectedScrollSnap();
      const selectedWeek = weeks[selectedIndex];

      // Update URL with selected date
      navigate({
        search: (prev) => ({
          ...prev,
          date: format(selectedWeek.startDate, DATE_FORMAT),
        }),
        replace: true,
      });

      // Check if we need to slide the window
      if (selectedIndex <= THRESHOLD_INDEX) {
        slideWindow('backward');
        api.scrollTo(THRESHOLD_INDEX + 1, false);
      } else if (selectedIndex >= weeks.length - THRESHOLD_INDEX - 1) {
        slideWindow('forward');
        api.scrollTo(weeks.length - THRESHOLD_INDEX - 2, false);
      }
    };

    api.on('select', onSelect);
    // return () => api.off('select', onSelect);
  }, [api, weeks, navigate, slideWindow]);

  const renderDayCell = (date: Date) => {
    const dateKey = format(date, DATE_FORMAT);
    // const counts = taskCounts[dateKey] || { completed: 0, goal: 0 };
    const isToday = isSameDay(date, new Date());
    const isSelected = isSameDay(date, selectedDate);

    return (
      <div
        key={dateKey}
        className={cn(
          'flex flex-col items-center rounded-lg p-2',
          'border transition-all duration-200',
          {
            'scale-105 border-white bg-gray-800': isSelected,
            'border-green-500': isToday && !isSelected,
            'border-transparent': !isToday && !isSelected,
          },
          'cursor-pointer hover:bg-gray-800/50',
        )}
        onClick={() => {
          navigate({
            search: (prev) => ({
              ...prev,
              date: format(date, DATE_FORMAT),
            }),
          });
        }}
      >
        <span className="text-sm text-gray-400">{format(date, 'EEE')}</span>
        <span className="my-1 text-lg font-bold">{format(date, 'd')}</span>
        {/* <TaskCounter completed={counts.completed} goal={counts.goal} /> */}
      </div>
    );
  };

  return (
    <div className={cn('rounded-xl bg-black p-4 text-white', className)}>
      <Carousel
        setApi={setApi}
        className="relative mx-auto w-full"
        opts={{
          align: 'center',
          containScroll: false,
          loop: false,
          dragFree: false,
          slidesToScroll: 1,
          skipSnaps: false,
          // duration: 20,
          startIndex: Math.floor(WINDOW_SIZE / 2), // Start in the middle
        }}
        plugins={[
          WheelGesturesPlugin({
            forceWheelAxis: 'x',
          }),
        ]}
      >
        <CarouselContent>
          {weeks.map((week) => (
            <CarouselItem key={week.id} className="flex w-full justify-between">
              <div className="grid w-full grid-cols-7 gap-2">
                {week.dates.map((date) => renderDayCell(date))}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

// function TaskCounter({ completed, goal }: TaskCount) {
//   const getCountColor = (completed: number, goal: number) => {
//     if (completed === 0) return 'text-gray-500';
//     if (completed > goal) return 'text-red-500';
//     return 'text-gray-300';
//   };

//   return (
//     <span className={cn('text-xs', getCountColor(completed, goal))}>
//       {completed}/{goal}
//     </span>
//   );
// }

// export { Calendar };
// export type { CalendarProps, TaskCount };
