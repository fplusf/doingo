import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { format, isBefore, startOfDay, addMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check } from 'lucide-react';

interface TimeSelectProps {
  value: string;
  endTime?: string;
  onChange: (time: string) => void;
  className?: string;
}

export const TimeSelect = ({ value, endTime, onChange, className }: TimeSelectProps) => {
  const [open, setOpen] = useState(false);
  const selectedTimeRef = useRef<HTMLDivElement>(null);

  // Generate time options starting from current time + 1 minute, then 15-minute intervals
  const timeOptions = useMemo(() => {
    const times: Date[] = [];
    const now = new Date();
    const nextMinute = addMinutes(now, 1);
    const start = startOfDay(now);

    // Add the next minute as the first option if it's not aligned with 15-min intervals
    if (nextMinute.getMinutes() % 15 !== 0) {
      times.push(nextMinute);
    }

    // Generate all times for the day in 15-minute intervals
    for (let i = 0; i < 96; i++) {
      // 24 hours * 4 (15-minute intervals)
      const time = addMinutes(start, i * 15);
      times.push(time);
    }

    // Sort times to ensure next minute is in correct position
    times.sort((a, b) => a.getTime() - b.getTime());

    return times;
  }, []);

  // Set default value to current time + 1 minute
  useEffect(() => {
    if (!value) {
      const now = new Date();
      const nextMinute = addMinutes(now, 1);
      onChange(format(nextMinute, 'HH:mm'));
    }
  }, [value, onChange]);

  useLayoutEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        if (selectedTimeRef.current) {
          selectedTimeRef.current.scrollIntoView({
            block: 'center',
            behavior: 'smooth',
          });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  const isTimeDisabled = (time: Date) => {
    const now = new Date();
    return isBefore(time, now);
  };

  const handleTimeSelect = (timeString: string) => {
    onChange(timeString);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={'outline'}
          size="sm"
          className={cn(
            'h-8 justify-start px-2 font-normal hover:bg-accent/50',
            endTime ? 'w-[9.5rem]' : 'w-[4.5rem]',
            className,
          )}
        >
          {value && endTime ? `${value} - ${endTime}` : value || format(new Date(), 'HH:mm')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] p-0" align="start">
        <ScrollArea className="h-80 overflow-y-auto">
          {timeOptions.map((time) => {
            const timeString = format(time, 'HH:mm');
            const isSelected = timeString === value;
            const isDisabled = isTimeDisabled(time);

            return (
              <DropdownMenuItem
                key={timeString}
                ref={isSelected ? selectedTimeRef : null}
                disabled={isDisabled}
                onSelect={() => handleTimeSelect(timeString)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-2 py-1.5',
                  isSelected && 'bg-accent',
                  isDisabled && 'text-muted-foreground opacity-50',
                )}
              >
                {timeString}
                {isSelected && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            );
          })}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
