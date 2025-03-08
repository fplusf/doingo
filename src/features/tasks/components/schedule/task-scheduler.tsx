import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { format } from 'date-fns';
import { Bell, Clock } from 'lucide-react';
import { useRef, useState } from 'react';
import { OptimalCalendar } from '../../../../shared/components/ui/optimal-calendar';
import { useTaskForm } from '../../context/task-form-context';

export type RepetitionOption = 'once' | 'daily' | 'weekly' | 'custom';

interface TaskSchedulerProps {
  className?: string;
}

export function TaskScheduler({ className }: TaskSchedulerProps) {
  const {
    values,
    updateValue,
    updateStartTime,
    updateStartDate,
    updateDueTime,
    updateDueDate,
    updateDuration,
    errors,
  } = useTaskForm();

  // State for UI controls
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isDueDatePopoverOpen, setIsDueDatePopoverOpen] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [customHours, setCustomHours] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [customDurationSet, setCustomDurationSet] = useState(false);
  const selectTriggerRef = useRef<HTMLButtonElement>(null);
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number | null>(null);

  // Removed callback invocations, using context directly
  const handleRepetitionChange = (value: RepetitionOption) => {
    updateValue('repetition', value);
  };

  const handleDurationSelectChange = (value: string) => {
    const minutes = parseInt(value, 10);
    if (!isNaN(minutes)) {
      updateDuration(minutes * 60 * 1000);
      setSelectedDuration(value);
      setCustomDurationSet(false);
    }
  };

  const handleCustomDurationSubmit = () => {
    const hours = parseInt(customHours, 10) || 0;
    const minutes = parseInt(customMinutes, 10) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes > 0) {
      updateDuration(totalMinutes * 60 * 1000);
      setCustomDurationMinutes(totalMinutes);
      setSelectedDuration(`custom:${totalMinutes}`);
      setCustomDurationSet(true);
      setIsSelectOpen(false);

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  };

  const formatDurationDisplay = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours ? `${hours}h${mins ? ` ${mins}m` : ''}` : `${mins}m`;
  };

  const handleCustomHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) >= 0)) {
      setCustomHours(value);
    }
  };

  const handleCustomMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (
      value === '' ||
      (/^\d+$/.test(value) && parseInt(value, 10) >= 0 && parseInt(value, 10) < 60)
    ) {
      setCustomMinutes(value);
    }
  };

  const durationMinutes = Math.round(values.duration / (60 * 1000));

  // Add a handler for due date selection with console logging
  const handleDueDateSelection = (date: Date, time: string) => {
    console.log('Due date selected:', { date, time });
    updateDueDate(date);
    updateDueTime(time);
    setIsDueDatePopoverOpen(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={cn('flex items-center gap-1.5', className)}>
        <Popover open={isStartDatePopoverOpen} onOpenChange={setIsStartDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-2 text-sm text-muted-foreground"
            >
              {values.startDate ? (
                <>
                  {format(values.startDate, 'MMM d')}{' '}
                  {values.startTime || format(new Date(), 'HH:mm')}
                </>
              ) : (
                format(new Date(), 'MMM d') + ' ' + format(new Date(), 'HH:mm')
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto border-none p-0 text-xs"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <OptimalCalendar
              size="sm"
              onSelect={(date, time) => {
                updateStartDate(date);
                updateStartTime(time);
                setIsStartDatePopoverOpen(false);
              }}
              selected={{ date: values.startDate || new Date(), time: values.startTime }}
            />
          </PopoverContent>
        </Popover>

        {/* Duration Selection */}
        <Select
          value={selectedDuration || durationMinutes.toString()}
          onValueChange={handleDurationSelectChange}
          open={isSelectOpen}
          onOpenChange={setIsSelectOpen}
        >
          <SelectTrigger ref={selectTriggerRef} className="h-8 min-w-[120px]">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <SelectValue placeholder="Duration">
                {customDurationSet
                  ? formatDurationDisplay(parseInt(selectedDuration.split(':')[1], 10))
                  : formatDurationDisplay(durationMinutes)}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {/* Custom duration input */}
            <div className="border-b border-border p-2">
              <div className="mb-1 text-xs text-muted-foreground">Custom duration (h:m):</div>
              <div className="flex items-center gap-1">
                <Input
                  className="h-8 w-12 text-center text-xs"
                  placeholder="0"
                  value={customHours}
                  onChange={handleCustomHoursChange}
                  type="text"
                  inputMode="numeric"
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') handleCustomDurationSubmit();
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm">h</span>
                <span className="mx-1 text-sm">:</span>
                <Input
                  className="h-8 w-12 text-center text-xs"
                  placeholder="0"
                  value={customMinutes}
                  onChange={handleCustomMinutesChange}
                  type="text"
                  inputMode="numeric"
                  min="0"
                  max="59"
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') handleCustomDurationSubmit();
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm">m</span>
                <Button size="sm" className="ml-2 h-8 px-2" onClick={handleCustomDurationSubmit}>
                  Set
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[220px]">
              <SelectGroup>
                {Array.from({ length: 32 }, (_, i) => (i + 1) * 15).map((minutes) => {
                  return (
                    <SelectItem key={minutes} value={minutes.toString()}>
                      {formatDurationDisplay(minutes)}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </ScrollArea>
          </SelectContent>
        </Select>

        <Popover open={isDueDatePopoverOpen} onOpenChange={setIsDueDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-2 text-sm text-muted-foreground"
            >
              {values.dueDate && values.dueTime ? (
                <>
                  {format(values.dueDate, 'MMM d')} {values.dueTime}
                </>
              ) : (
                <>
                  <Bell className="h-3.5 w-3.5" />
                  <span>Due</span>
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
                onSelect={handleDueDateSelection}
                selected={
                  values.dueDate
                    ? {
                        date: values.dueDate,
                        time: values.dueTime,
                      }
                    : undefined
                }
              />
            </div>
          </PopoverContent>
        </Popover>

        <Select value={values.repetition || 'once'} onValueChange={handleRepetitionChange}>
          <SelectTrigger className="h-8 w-[100px] px-2 text-sm">
            <SelectValue>
              {(values.repetition || 'once').charAt(0).toUpperCase() +
                (values.repetition || 'once').slice(1)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="once">Once</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
