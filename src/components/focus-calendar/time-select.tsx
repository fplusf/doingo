import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { format, isBefore, startOfDay, addMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const selectedTimeRef = useRef<HTMLButtonElement>(null);

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
      // Small delay to ensure the PopoverContent is rendered
      const timeoutId = setTimeout(() => {
        if (selectedTimeRef.current) {
          selectedTimeRef.current.scrollIntoView({
            block: 'center',
            behavior: 'instant',
          });
        }
      }, 0);

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 justify-start bg-transparent px-2 font-normal hover:bg-accent/50',
            endTime ? 'w-[9.5rem]' : 'w-[4.5rem]',
            className,
          )}
        >
          {value && endTime ? `${value} - ${endTime}` : value || format(new Date(), 'HH:mm')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <ScrollArea className="h-80">
          <div className="p-1">
            {timeOptions.map((time) => {
              const timeString = format(time, 'HH:mm');
              const isSelected = timeString === value;
              const isDisabled = isTimeDisabled(time);

              return (
                <Button
                  key={timeString}
                  ref={isSelected ? selectedTimeRef : null}
                  variant="ghost"
                  size="sm"
                  disabled={isDisabled}
                  className={cn(
                    'w-full justify-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                    isSelected && 'bg-accent',
                    isDisabled && 'text-muted-foreground opacity-50',
                  )}
                  onClick={() => handleTimeSelect(timeString)}
                >
                  {timeString}
                  {isSelected && <Check className="ml-auto h-4 w-4" />}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
