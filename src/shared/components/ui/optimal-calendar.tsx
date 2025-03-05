import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import * as React from 'react';

type DatePickerValue = { date: Date; time: string };

interface CalendarDatePickerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onSelect?: (date: Date, time: string) => void;
  selected?: DatePickerValue;
  weekStartsOn?: number;
}

export function OptimalCalendar({
  className,
  size = 'md',
  onSelect,
  selected = { date: new Date(), time: '09:00' },
}: CalendarDatePickerProps) {
  const [date, setDate] = React.useState<Date>(selected.date);
  const [selectedTime, setSelectedTime] = React.useState<string>(selected.time);
  const [isTimePickerOpen, setIsTimePickerOpen] = React.useState(false);
  const timePickerRef = React.useRef<HTMLDivElement>(null);
  const timePickerButtonRef = React.useRef<HTMLButtonElement>(null);
  const timePickerContainerRef = React.useRef<HTMLDivElement>(null);

  const timeOptions = React.useMemo(() => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        options.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return options;
  }, []);

  console.log('timeOptions', timeOptions);

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getMonthData = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysFromPrevMonth = startDay;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

    const days = [];

    for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
      days.push({ day: i, currentMonth: false, month: prevMonth, year: prevMonthYear });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true, month, year });
    }

    const remainingDays = 42 - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;

    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, currentMonth: false, month: nextMonth, year: nextMonthYear });
    }

    return days;
  };

  const monthData = getMonthData(date.getFullYear(), date.getMonth());
  const monthName = date.toLocaleString('default', { month: 'long' });

  const handlePrevMonth = () => {
    setDate((prev) => {
      const prevMonth = new Date(prev);
      prevMonth.setMonth(prev.getMonth() - 1);
      return prevMonth;
    });
  };

  const handleNextMonth = () => {
    setDate((prev) => {
      const nextMonth = new Date(prev);
      nextMonth.setMonth(prev.getMonth() + 1);
      return nextMonth;
    });
  };

  const handleDayClick = (day: number, month: number, year: number) => {
    const newDate = new Date(date);
    newDate.setFullYear(year, month, day);
    setDate(newDate);
  };

  const isSelectedDay = (day: number, month: number, year: number) => {
    return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
  };

  const handleApply = () => {
    onSelect?.(new Date(date.getFullYear(), date.getMonth(), date.getDate()), selectedTime);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        timePickerContainerRef.current &&
        !timePickerContainerRef.current.contains(event.target as Node) &&
        timePickerButtonRef.current &&
        !timePickerButtonRef.current.contains(event.target as Node)
      ) {
        setIsTimePickerOpen(false);
      }
    };

    if (isTimePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);

      // Set scroll position
      if (timePickerRef.current) {
        const selectedIndex = timeOptions.indexOf(selectedTime);
        if (selectedIndex !== -1) {
          const itemHeight = size === 'sm' ? 28 : size === 'md' ? 30 : 32;
          setTimeout(() => {
            if (timePickerRef.current) {
              timePickerRef.current.scrollTop = selectedIndex * itemHeight - 70;
            }
          }, 10);
        }
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTimePickerOpen, selectedTime, timeOptions, size]);

  const sizeClasses = {
    sm: {
      container: 'w-[210px] p-2',
      monthName: 'text-sm',
      dayButton: 'h-6 w-6 text-xs',
      timeButton: 'text-xs',
      actionButton: 'text-xs py-1 px-2 h-7',
    },
    md: {
      container: 'w-[245px] p-2.5',
      monthName: 'text-base',
      dayButton: 'h-7 w-7 text-sm',
      timeButton: 'text-sm',
      actionButton: 'text-sm py-1.5 px-3 h-8',
    },
    lg: {
      container: 'w-[280px] p-3',
      monthName: 'text-lg',
      dayButton: 'h-8 w-8 text-base',
      timeButton: 'text-base',
      actionButton: 'text-base py-2 px-4 h-9',
    },
  };

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-border bg-card text-foreground',
        sizeClasses[size].container,
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className={cn('font-medium', sizeClasses[size].monthName)}>{monthName}</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'rounded-full p-0 text-foreground hover:bg-muted',
              size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-7 w-7' : 'h-8 w-8',
            )}
            onClick={handlePrevMonth}
          >
            <ChevronLeft
              className={size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'rounded-full p-0 text-foreground hover:bg-muted',
              size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-7 w-7' : 'h-8 w-8',
            )}
            onClick={() => setDate(new Date())}
          >
            <Circle className={size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'rounded-full p-0 text-foreground hover:bg-muted',
              size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-7 w-7' : 'h-8 w-8',
            )}
            onClick={handleNextMonth}
          >
            <ChevronRight
              className={size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'}
            />
          </Button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {daysOfWeek.map((day, index) => (
          <div
            key={index}
            className={cn('text-center text-gray-400', sizeClasses[size].timeButton)}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthData.map((item, index) => (
          <button
            key={index}
            className={cn(
              'flex items-center justify-center rounded-md',
              sizeClasses[size].dayButton,
              item.currentMonth ? 'text-white' : 'text-gray-500',
              isSelectedDay(item.day, item.month, item.year) &&
                'bg-primary text-primary-foreground',
              !isSelectedDay(item.day, item.month, item.year) && 'hover:bg-muted',
              isToday(new Date(item.year, item.month, item.day)) &&
                !isSelectedDay(item.day, item.month, item.year) &&
                'text-primary',
            )}
            onClick={() => handleDayClick(item.day, item.month, item.year)}
          >
            {item.day}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className={cn('mr-2 font-semibold', sizeClasses[size].timeButton)}>Time</span>
        <Select value={selectedTime} onValueChange={setSelectedTime}>
          <SelectTrigger
            className={cn(
              'border border-border bg-card text-foreground hover:bg-muted',
              sizeClasses[size].actionButton,
              'w-auto min-w-20',
            )}
          >
            <SelectValue placeholder={selectedTime}>{selectedTime}</SelectValue>
          </SelectTrigger>
          <SelectContent className="p-0">
            <ScrollArea className="h-[200px]">
              <div className="p-1">
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </div>
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-2 flex justify-between gap-2">
        <Button
          variant="outline"
          className={cn(
            'flex-1 border-0 bg-card text-foreground hover:bg-muted',
            sizeClasses[size].actionButton,
          )}
        >
          Cancel
        </Button>
        <Button
          className={cn(
            'flex-1 border-0 bg-primary text-primary-foreground hover:bg-primary/90',
            sizeClasses[size].actionButton,
          )}
          onClick={handleApply}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
