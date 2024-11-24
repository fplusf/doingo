import { cn } from '@/lib/utils';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useGesture } from '@use-gesture/react';
import { addDays, addWeeks, format, isSameDay, parse, startOfWeek, subWeeks } from 'date-fns';
import { ChevronRight } from 'lucide-react';
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

interface TaskCount {
  completed: number;
  goal: number;
}

interface CalendarProps {
  className?: string;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  taskCounts?: { [date: string]: TaskCount };
}

interface NavigateWeekProps {
  direction: 'prev' | 'next';
  api?: CarouselApi;
  isAnimating: boolean;
  setIsAnimating: (value: boolean) => void;
  currentWeekStart: Date;
  setCurrentWeekStart: (date: Date) => void;
  navigate: (params: {
    search: (prev: Record<string, string | undefined>) => Record<string, string | undefined>;
  }) => void;
}

const DAYS_COUNT = 7;
const DATE_FORMAT = 'yyyy-MM-dd';

function Calendar({
  className,
  selectedDate = new Date(),
  onDateSelect,
  taskCounts = {},
}: CalendarProps) {
  const search = useSearch({ from: '/' });
  const navigate = useNavigate({ from: FocusRoute.fullPath });

  // Parse week from URL or use default
  const initialWeek = React.useMemo(() => {
    if (search.week) {
      return parse(search.week, DATE_FORMAT, new Date());
    }
    return startOfWeek(selectedDate, { weekStartsOn: 1 }); // Set Monday as the first day of the week
  }, [search.week, selectedDate]);

  const [currentWeekStart, setCurrentWeekStart] = React.useState(initialWeek);
  const [currendDay, setCurrentDay] = React.useState(selectedDate);
  const [api, setApi] = React.useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = React.useState(1); // Start at middle week
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Get previous, current and next week
  const weeks = [subWeeks(currentWeekStart, 1), currentWeekStart, addWeeks(currentWeekStart, 1)];

  console.log('weeks', weeks);
  const navigateWeek = ({
    direction,
    api,
    isAnimating,
    setIsAnimating,
    currentWeekStart,
    setCurrentWeekStart,
    navigate,
  }: NavigateWeekProps) => {
    try {
      // Prevent multiple rapid transitions
      if (isAnimating || !api) return;

      setIsAnimating(true);

      // Move carousel
      if (direction === 'prev') {
        api.scrollPrev();
      } else {
        api.scrollNext();
      }

      // Update date
      const newDate = addDays(currentWeekStart, direction === 'prev' ? -DAYS_COUNT : DAYS_COUNT);
      setCurrentWeekStart(newDate);

      // Update URL params
      navigate({
        search: (prevSearch: Record<string, string | undefined>) => ({
          ...prevSearch,
          week: format(newDate, DATE_FORMAT),
        }),
      });

      // Reset animation flag after transition
      setTimeout(() => setIsAnimating(false), 300);
    } catch (error) {
      console.error('Error navigating week:', error);
      setIsAnimating(false);
    }
  };

  const bind = useGesture(
    {
      onWheel: ({ direction: [dx], memo }) => {
        if (memo) return memo; // Prevent multiple navigations
        navigateWeek({
          direction: dx < 0 ? 'prev' : 'next',
          api,
          isAnimating,
          setIsAnimating,
          currentWeekStart,
          setCurrentWeekStart,
          navigate,
        });
        return true; // Set memo to true to indicate navigation has occurred
      },
      onWheelEnd: () => {
        return false; // Reset memo to allow new gesture
      },
    },
    {
      // Add any specific configuration if needed
    },
  );

  const handleCarouselChange = React.useCallback(
    async (emblaApi: CarouselApi) => {
      if (!emblaApi) return;

      const currentIdx = emblaApi.selectedScrollSnap();
      console.log('Carousel index:', currentIdx);
      if (isAnimating) return;
      setIsAnimating(true);

      // Handle edge cases
      if (currentIdx === 0 || currentIdx === 2) {
        // Update the current week
        const newWeekStart =
          currentIdx === 0 ? subWeeks(currentWeekStart, 1) : addWeeks(currentWeekStart, 1);

        setCurrentWeekStart(newWeekStart);

        // Update URL
        navigate({
          search: (prev) => ({
            ...prev,
            week: format(newWeekStart, DATE_FORMAT),
          }),
        });

        // Reset carousel to middle position after transition
        await new Promise((resolve) => setTimeout(resolve, 300));
        api?.scrollTo(1, false);
        setCurrentIndex(1);
      }

      setIsAnimating(false);
    },
    [currentWeekStart, isAnimating, api?.containerNode()],
  );

  React.useEffect(() => {
    if (api) {
      api.on('select', handleCarouselChange);
    }
    return () => {
      api?.off('select', handleCarouselChange);
    };
  }, [currentWeekStart, api?.containerNode()]);

  React.useEffect(() => {
    if (!search.week) {
      navigate({
        search: (prev) => ({
          ...prev,
          week: format(currentWeekStart, DATE_FORMAT),
        }),
      });
    }
  }, [currentWeekStart, search.week, navigate]);

  const renderDayCell = (date: Date) => {
    const dateKey = format(date, DATE_FORMAT);
    const counts = taskCounts[dateKey] || { completed: 0, goal: 0 };
    const isToday = isSameDay(date, new Date());
    const isSelected = isSameDay(date, currendDay);

    const getCountColor = (completed: number, goal: number) => {
      if (completed === 0) return 'text-gray-500';
      if (completed > goal) return 'text-red-500';
      return 'text-gray-300';
    };

    return (
      <div
        key={dateKey}
        className={cn(
          'flex flex-col items-center rounded-lg p-2',
          // Base border style
          'border',
          // Selection states with precedence
          {
            'border-white bg-gray-800': isSelected,
            'border-green-500': isToday && !isSelected,
            'border-transparent': !isToday && !isSelected,
          },
          // Hover state
          'cursor-pointer transition-colors hover:bg-gray-800',
        )}
        onClick={() => {
          setCurrentDay(date);
          onDateSelect?.(date);

          console.log('date', { date, currendDay });
        }}
      >
        <span className="text-sm text-gray-400">{format(date, 'EEE')}</span>
        <span className="my-1 text-lg font-bold">{format(date, 'd')}</span>
        <span className={cn('text-xs', getCountColor(counts.completed, counts.goal))}>
          {counts.completed}/{counts.goal}
        </span>
      </div>
    );
  };

  return (
    <div className={cn('rounded-xl bg-black p-4 text-white', className)} {...bind()}>
      {/* <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() =>
            navigateWeek({
              direction: 'prev',
              api,
              isAnimating,
              setIsAnimating,
              currentWeekStart,
              setCurrentWeekStart,
              navigate,
            })
          }
          disabled={isAnimating}
          className="p-1"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold">
          <span className="text-green-500">{format(currentWeekStart, 'MMMM')}</span>{' '}
          <span>{format(currentWeekStart, 'yyyy')}</span>
        </h2>
        
      </div> */}

      <Carousel
        setApi={setApi}
        className="relative mx-auto w-full"
        opts={{
          containScroll: false,
          align: 'center',
          dragFree: true,
        }}
      >
        <CarouselContent>
          {weeks.map((weekStart, idx) => (
            <CarouselItem key={weekStart.toISOString()} className="flex w-full justify-between">
              <div className="grid w-full grid-cols-7 gap-2">
                {[...Array(7)].map((_, i) => renderDayCell(addDays(weekStart, i)))}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious
          onClick={() =>
            navigateWeek({
              direction: 'next',
              api,
              isAnimating,
              setIsAnimating,
              currentWeekStart,
              setCurrentWeekStart,
              navigate,
            })
          }
          disabled={isAnimating}
          className="p-1"
        >
          <ChevronRight className="h-5 w-5" />
        </CarouselPrevious>

        <CarouselNext
          onClick={() =>
            navigateWeek({
              direction: 'next',
              api,
              isAnimating,
              setIsAnimating,
              currentWeekStart,
              setCurrentWeekStart,
              navigate,
            })
          }
          disabled={isAnimating}
          className="p-1"
        >
          <ChevronRight className="h-5 w-5" />
        </CarouselNext>
      </Carousel>
    </div>
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
export type { CalendarProps, TaskCount };
