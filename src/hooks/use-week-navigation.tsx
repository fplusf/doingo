import { gsap } from '@/lib/gsap';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { addWeeks, format, parse } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { DATE_FORMAT } from '../shared/constants/date';

export function useWeekNavigation() {
  const navigate = useNavigate({ from: '/' });
  const search = useSearch({ from: '/' });
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState(() =>
    search.date ? parse(search.date, DATE_FORMAT, today) : today,
  );

  useEffect(() => {
    if (!search.date) {
      navigate({
        search: (prev) => ({
          ...prev,
          date: format(today, DATE_FORMAT),
        }),
      });
    } else {
      setSelectedDate(parse(search.date, DATE_FORMAT, today));
    }
  }, [search.date]);

  const handleDateSelect = useCallback(
    (date: Date) => {
      setSelectedDate(date);
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

  const handlePrev = useCallback(() => {
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

  return {
    selectedDate,
    handleDateSelect,
    handleNext,
    handlePrev,
  };
}
