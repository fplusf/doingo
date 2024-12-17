import { gsap } from '@/lib/gsap';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { addDays, addWeeks, format, parse, startOfWeek } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { DATE_FORMAT } from '../shared/constants/date';

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

export function useWeekNavigation() {
  const navigate = useNavigate({ from: '/' });
  const search = useSearch({ from: '/' });
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState(() =>
    search.date ? parse(search.date, DATE_FORMAT, today) : today,
  );

  const [weeks, setWeeks] = useState(() => {
    const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 3 }).map((_, offset) => {
      const weekStart = addWeeks(currentWeekStart, offset - 1);
      return createWeekData(weekStart);
    });
  });

  useEffect(() => {
    const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    setWeeks(
      Array.from({ length: 3 }).map((_, offset) => {
        const weekStart = addWeeks(currentWeekStart, offset - 1);
        return createWeekData(weekStart);
      }),
    );
  }, [selectedDate]);

  useEffect(() => {
    if (!search.date) {
      navigate({
        search: (prev) => ({
          ...prev,
          date: format(today, DATE_FORMAT),
        }),
      });
    } else {
      const newDate = parse(search.date, DATE_FORMAT, today);
      setSelectedDate(newDate);
    }
  }, [search.date]);

  const handleDateSelect = useCallback(
    (date: Date) => {
      navigate({
        search: (prev) => ({
          ...prev,
          date: format(date, DATE_FORMAT),
        }),
      });
    },
    [navigate],
  );

  const handleNext = useCallback(() => {
    const nextDate = addWeeks(selectedDate, 1);
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

  const handlePrev = useCallback(() => {
    const prevDate = addWeeks(selectedDate, -1);
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

  return {
    selectedDate,
    weeks,
    handleDateSelect,
    handleNext,
    handlePrev,
  };
}
