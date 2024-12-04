import { cn } from '@/lib/utils';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { addDays, addWeeks, format, isSameDay, parse, startOfWeek } from 'date-fns';
import * as React from 'react';
import 'swiper/css';
import 'swiper/css/virtual';
import { Mousewheel, Virtual } from 'swiper/modules';
import { Swiper, SwiperClass, SwiperSlide } from 'swiper/react';
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
  const [swiperRef, setSwiperRef] = React.useState<SwiperClass | null>(null);
  const appendWeekRef = React.useRef(1);
  const prependWeekRef = React.useRef(-1);

  const search = useSearch({ from: '/' });
  const navigate = useNavigate({ from: FocusRoute.fullPath });
  const today = new Date();
  const selectedDate = React.useMemo(
    () => (search.date ? parse(search.date, DATE_FORMAT, today) : today),
    [search.date],
  );

  // Initialize with 3 weeks
  const [weeks, setWeeks] = React.useState(() => {
    const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 2 });
    return [-1, 0, 1].map((offset) => {
      const weekStart = addWeeks(currentWeekStart, offset);
      return createWeekData(weekStart);
    });
  });

  const appendWeek = React.useCallback(() => {
    console.log('appendWeek');
    setWeeks((current) => [
      ...current,
      createWeekData(
        addWeeks(startOfWeek(selectedDate, { weekStartsOn: 2 }), ++appendWeekRef.current),
      ),
    ]);
  }, [selectedDate]);

  const prependWeek = React.useCallback(() => {
    console.log('prependWeek');
    setWeeks((current) => {
      const newWeeks = [
        createWeekData(
          addWeeks(startOfWeek(selectedDate, { weekStartsOn: 2 }), --prependWeekRef.current),
        ),
        ...current,
      ];
      swiperRef?.slideTo(swiperRef.activeIndex + 1, 0);
      return newWeeks;
    });
  }, [selectedDate, swiperRef]);

  // const handleWheel = React.useCallback(
  //   (event: WheelEvent) => {
  //     if (event.deltaY > 0) {
  //       appendWeek();
  //     } else {
  //       prependWeek();
  //     }
  //   },
  //   [appendWeek, prependWeek],
  // );

  // Add wheel event listener
  // React.useEffect(() => {
  //   const element = document.querySelector('.swiper-wrapper');
  //   if (element) {
  //     element.addEventListener('wheel', handleWheel as EventListener);
  //     return () => element.removeEventListener('wheel', handleWheel as EventListener);
  //   }
  // }, [handleWheel]);

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

  const onWheel = React.useCallback((event: WheelEvent) => {
    console.log('onWheel', event.deltaY);
    if (event.deltaY > 0) {
      appendWeek();
    } else {
      prependWeek();
    }
  }, []);

  // Find the current week index
  const currentWeekIndex = React.useMemo(() => {
    return weeks.findIndex((week) => week.dates.some((date) => isSameDay(date, selectedDate)));
  }, [weeks, selectedDate]);

  return (
    <div className={cn('mx-auto h-[104px] w-full overflow-hidden pt-2 text-white', className)}>
      <Swiper
        modules={[Virtual, Mousewheel]}
        onSwiper={setSwiperRef}
        cssMode={true}
        direction="horizontal"
        speed={300}
        spaceBetween={30}
        initialSlide={1}
        mousewheel={true}
        onNavigationNext={appendWeek}
        onNavigationPrev={prependWeek}
        onWheel={() => onWheel}
        virtual={{
          enabled: true,
          addSlidesBefore: 1,
          addSlidesAfter: 1,
          cache: true,
        }}
        className="h-full w-full"
      >
        {weeks.map((weekData, index) => (
          <SwiperSlide key={weekData.id} virtualIndex={index} className="h-full">
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
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
