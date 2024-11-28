import { cn } from '@/lib/utils';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { addDays, addWeeks, format, isSameDay, parse, startOfWeek, subWeeks } from 'date-fns';
import * as React from 'react';
import { Mousewheel, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FocusRoute } from '../../routes/routes';
// import Swiper styles
import 'swiper/css/bundle';

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

export function WeekNavigator({
  className,
  onDateSelect,
}: {
  className?: string;
  onDateSelect: (date: Date) => void;
}) {
  const search = useSearch({ from: '/' });
  const navigate = useNavigate({ from: FocusRoute.fullPath });

  // Initialize with today's date
  const today = new Date();

  // Simplified useMemo that only handles date parsing
  const selectedDate = React.useMemo(() => {
    return search.date ? parse(search.date, DATE_FORMAT, today) : today;
  }, [search.date]);

  // Handle navigation in useEffect
  React.useEffect(() => {
    if (!search.date) {
      navigate({
        search: (prev) => ({
          ...prev,
          date: format(today, DATE_FORMAT),
        }),
      });
    }
  }, [search.date, navigate]);

  // Keep track of the central date for our window
  const [centerDate, setCenterDate] = React.useState(() =>
    startOfWeek(selectedDate, { weekStartsOn: 1 }),
  );

  // Generate and maintain our sliding window of weeks
  const [weeks, setWeeks] = React.useState<WeekData[]>(() => {
    const center = startOfWeek(centerDate, { weekStartsOn: 1 });
    const start = subWeeks(center, 26); // 52 weeks in a year, so 26 weeks before the center

    return Array.from({ length: 52 }).map((_, i) => createWeekData(addWeeks(start, i)));
  });

  // Memoize date selection handler
  const handleDateSelect = React.useCallback((date: Date) => {
    navigate({
      search: (prev) => ({
        ...prev,
        date: format(date, DATE_FORMAT),
      }),
    });
  }, []);

  // Update weeks when selectedDate at the edge of the year
  React.useEffect(() => {
    const newCenterDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
    setCenterDate(newCenterDate);

    const start = subWeeks(newCenterDate, 26);
    const newWeeksForYear = Array.from({ length: 52 }).map((_, i) =>
      createWeekData(addWeeks(start, i)),
    );

    // Shift window when selectedDate is at the edge
    if (weeks[THRESHOLD_INDEX].id === newWeeksForYear[THRESHOLD_INDEX].id) {
      setWeeks(newWeeksForYear);
    }

    console.log('weeks: ', { weeks, selectedDate });
  }, [selectedDate]);

  const renderDayCell = React.useCallback(
    (date: Date) => {
      const isSelected = isSameDay(date, selectedDate);
      const isToday = isSameDay(date, new Date());

      return (
        <div
          className={cn(
            'flex h-full w-full flex-col items-center justify-center rounded-lg p-2',
            'cursor-pointer transition-all duration-200',
            {
              'scale-105 bg-gray-800 ring-2 ring-white': isSelected,
              'ring-2 ring-green-500': isToday && !isSelected,
              'hover:bg-gray-800/50': !isSelected,
            },
          )}
          onClick={() => {
            handleDateSelect(date);
            onDateSelect(date);
          }}
        >
          <span className="text-sm font-medium text-gray-400">{format(date, 'EEE')}</span>
          <span className="my-1 text-lg font-bold">{format(date, 'd')}</span>
        </div>
      );
    },
    [selectedDate, handleDateSelect, onDateSelect],
  );

  return (
    <div className={cn('mx-auto w-full max-w-4xl rounded-xl bg-black p-4 text-white', className)}>
      <Swiper
        direction={'horizontal'}
        slidesPerView={1}
        slidesPerGroup={1}
        speed={300}
        spaceBetween={30}
        cssMode={true}
        keyboard={{
          enabled: true,
          onlyInViewport: true,
        }}
        modules={[Mousewheel, Pagination]}
      >
        {weeks.map((week) => (
          <SwiperSlide key={week.id}>
            <div className="grid w-full grid-cols-7 gap-2">
              {week.dates.map((date, i) => (
                <div key={`${week.id}-${i}`}>{renderDayCell(date)}</div>
              ))}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
