import { gsap } from '@/lib/gsap';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { addDays, addWeeks, format, isSameWeek, parse, startOfWeek } from 'date-fns';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TasksRoute } from '../../../routes/routes';
import { DATE_FORMAT } from '../../../shared/constants/date';

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
  const navigate = useNavigate({ from: TasksRoute.fullPath });
  const search = useSearch({ from: TasksRoute.fullPath });

  // Use a ref for today to avoid recreating it on every render
  const todayRef = useRef(new Date());
  const today = todayRef.current;

  // Initialize with today's date regardless of what's in search params
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewDate, setViewDate] = useState(today);
  const [isInitialized, setIsInitialized] = useState(false);

  const [weeks, setWeeks] = useState(() => {
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 3 }).map((_, offset) => {
      const weekStart = addWeeks(currentWeekStart, offset - 1);
      return createWeekData(weekStart);
    });
  });

  // Position to middle week immediately without animation
  useEffect(() => {
    if (!isInitialized) {
      gsap.set('.week', { xPercent: -100 }); // Ensure middle week is shown
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    const currentWeekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
    const newWeeks = Array.from({ length: 3 }).map((_, offset) => {
      const weekStart = addWeeks(currentWeekStart, offset - 1);
      return createWeekData(weekStart);
    });
    setWeeks(newWeeks);
  }, [viewDate]);

  // Update selected date and view date when search params change
  useEffect(() => {
    // If there's no date in search params, set it to today
    if (!search.date) {
      navigate({
        search: (prev) => ({
          ...prev,
          date: format(today, DATE_FORMAT),
        }),
      });
    } else {
      // If there is a date in search params, use it
      const newDate = parse(search.date, DATE_FORMAT, today);
      const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 });
      setSelectedDate(newDate);
      setViewDate(newWeekStart);
    }
  }, [search.date, navigate]);

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
    const nextDate = addWeeks(viewDate, 1);
    const nextWeekStart = startOfWeek(nextDate, { weekStartsOn: 1 });
    setViewDate(nextWeekStart);
    navigate({
      search: (prev) => ({
        ...prev,
        date: format(nextDate, DATE_FORMAT),
      }),
    });

    nextAnimation();
  }, [viewDate, navigate]);

  const handlePrev = useCallback(() => {
    const prevDate = addWeeks(viewDate, -1);
    const prevWeekStart = startOfWeek(prevDate, { weekStartsOn: 1 });
    setViewDate(prevWeekStart);
    navigate({
      search: (prev) => ({
        ...prev,
        date: format(prevDate, DATE_FORMAT),
      }),
    });

    prevAnimation();
  }, [viewDate, navigate]);

  const navigateToDate = useCallback(
    (targetDate: Date) => {
      if (!targetDate) return;

      const targetWeekStart = startOfWeek(targetDate, { weekStartsOn: 1 });

      // Update viewDate first to trigger weeks update
      setViewDate(targetWeekStart);

      // Then update URL with the actual target date
      navigate({
        search: (prev) => ({
          ...prev,
          date: format(targetDate, DATE_FORMAT),
        }),
      });

      const isSame = isSameWeek(targetDate, selectedDate, {
        weekStartsOn: 1,
      });

      // if the target date is the same as the selected date, just update search param
      // and do not animate
      if (isSame) {
        return;
      }

      setTimeout(() => {
        const isBefore = targetDate < selectedDate;

        // Ensure middle week is shown
        if (isBefore) {
          prevAnimation();
        } else {
          nextAnimation();
        }
      }, 100);
    },
    [navigate, selectedDate],
  );

  const prevAnimation = () => {
    gsap.fromTo(
      '.week',
      { xPercent: -200 },
      {
        xPercent: -100,
        duration: 0.4,
        ease: 'power1.inOut',
      },
    );
  };

  const nextAnimation = () => {
    gsap.fromTo(
      '.week',
      { xPercent: 0 },
      {
        xPercent: '-=100',
        duration: 0.4,
        ease: 'power1.inOut',
      },
    );
  };

  return {
    selectedDate,
    weeks,
    handleDateSelect,
    handleNext,
    handlePrev,
    navigateToDate,
  };
}
