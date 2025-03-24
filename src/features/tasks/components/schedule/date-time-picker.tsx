import { Button } from '@/shared/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { OptimalCalendar } from '../../../../shared/components/ui/optimal-calendar';

interface DateTimeSelectorProps {
  date?: Date;
  time?: string;
  onChange: (date: Date, time: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  buttonLabel?: string;
  isDue?: boolean;
}

export function DateTimePicker({
  date,
  time,
  onChange,
  placeholder = 'Select date',
  icon = <CalendarIcon className="h-3.5 w-3.5" />,
  buttonLabel,
  isDue = false,
}: DateTimeSelectorProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleDateTimeSelection = (selectedDate: Date, selectedTime: string) => {
    onChange(selectedDate, selectedTime);
    setIsPopoverOpen(false);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2 text-sm text-muted-foreground"
        >
          {date && time ? (
            <>
              {icon}
              {format(date, 'MMM d')} {time}
            </>
          ) : isDue ? (
            <>
              {icon}
              <span>{buttonLabel || 'Due'}</span>
            </>
          ) : (
            <>
              {icon}
              {format(new Date(), 'MMM d')} {format(new Date(), 'HH:mm')}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto border-none p-0 text-xs"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <div className="flex flex-col gap-0 p-0">
          <OptimalCalendar
            size="sm"
            onSelect={handleDateTimeSelection}
            selected={
              date
                ? {
                    date,
                    time: time || '',
                  }
                : undefined
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
