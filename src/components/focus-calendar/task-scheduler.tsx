import { useState, useEffect } from 'react';
import { format, parse, addMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimeSelect } from './time-select';
import { DurationPicker, DurationOption } from './duration-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type RepetitionOption = 'once' | 'daily' | 'weekly' | 'custom';

interface TaskSchedulerProps {
  startDate?: Date;
  startTime?: string;
  duration?: DurationOption;
  repetition?: RepetitionOption;
  onStartDateChange?: (date: Date) => void;
  onStartTimeChange?: (time: string) => void;
  onDurationChange?: (duration: DurationOption) => void;
  onRepetitionChange?: (repetition: RepetitionOption) => void;
  className?: string;
}

export function TaskScheduler({
  startDate: initialStartDate,
  startTime: initialStartTime,
  duration: initialDuration,
  repetition: initialRepetition = 'once',
  onStartDateChange,
  onStartTimeChange,
  onDurationChange,
  onRepetitionChange,
  className,
}: TaskSchedulerProps) {
  const [startDate, setStartDate] = useState<Date>(
    initialStartDate ? new Date(initialStartDate) : new Date(),
  );
  const [startTime, setStartTime] = useState(initialStartTime || '');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState<DurationOption>(
    initialDuration || {
      label: '1 hr',
      millis: 60 * 60_000,
    },
  );
  const [repetition, setRepetition] = useState<RepetitionOption>(initialRepetition);

  // Update end time when start time or duration changes
  useEffect(() => {
    if (startTime && duration) {
      try {
        // Validate time format
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
          console.warn('Invalid time format:', startTime);
          return;
        }

        const start = parse(startTime, 'HH:mm', new Date());
        if (isNaN(start.getTime())) {
          console.warn('Invalid parsed time:', start);
          return;
        }

        const durationInMinutes = Math.max(0, duration.millis / 60_000);
        const end = addMinutes(start, durationInMinutes);

        if (isNaN(end.getTime())) {
          console.warn('Invalid end time calculation');
          return;
        }

        setEndTime(format(end, 'HH:mm'));
      } catch (error) {
        console.error('Error calculating end time:', error);
      }
    }
  }, [startTime, duration]);

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    onStartTimeChange?.(time);
  };

  const handleDurationChange = (value: DurationOption) => {
    setDuration(value);
    onDurationChange?.(value);
  };

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
    onStartDateChange?.(date);
  };

  const handleRepetitionChange = (value: RepetitionOption) => {
    setRepetition(value);
    onRepetitionChange?.(value);
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2 text-sm text-muted-foreground"
          >
            {startDate ? format(startDate, 'MMM d') : format(new Date(), 'MMM d')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(date) => date && handleStartDateChange(date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <TimeSelect
        value={startTime}
        endTime={duration ? endTime : undefined}
        onChange={handleStartTimeChange}
        className="text-muted-foreground"
      />

      <DurationPicker value={duration} onValueChange={handleDurationChange} />

      <Select value={repetition} onValueChange={handleRepetitionChange}>
        <SelectTrigger className="h-8 w-[100px] px-2 text-sm">
          <SelectValue>{repetition.charAt(0).toUpperCase() + repetition.slice(1)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="once">Once</SelectItem>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
