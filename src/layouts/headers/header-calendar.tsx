import { Button } from '@/shared/components/ui/button';
import { OptimalCalendar } from '@/shared/components/ui/optimal-calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { CalendarDays } from 'lucide-react';
import * as React from 'react';
import { useWeekNavigation } from '../../features/tasks/hooks/use-week-navigation';

export function DatePicker() {
  const { navigateToDate, selectedDate } = useWeekNavigation();
  const [date, setDate] = React.useState<Date>();

  const onselect = (date?: Date) => {
    if (!date) return;

    setDate(date);
    navigateToDate(date);
  };

  React.useEffect(() => {
    // sync the calendar with the current week.
    setDate(selectedDate);
  }, [selectedDate]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <CalendarDays />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" side="bottom" sideOffset={4}>
        <OptimalCalendar
          size="sm"
          weekStartsOn={1}
          selected={date ? { date, time: '09:00' } : undefined}
          onSelect={(date, _time) => onselect(date)}
          className="w-[240px]"
        />
      </PopoverContent>
    </Popover>
  );
}
