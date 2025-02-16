import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useWeekNavigation } from '../../hooks/use-week-navigation';

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
        <Calendar
          mode="single"
          weekStartsOn={1}
          selected={date}
          defaultMonth={selectedDate}
          onSelect={onselect}
          initialFocus
          className="w-[240px]"
        />
      </PopoverContent>
    </Popover>
  );
}
