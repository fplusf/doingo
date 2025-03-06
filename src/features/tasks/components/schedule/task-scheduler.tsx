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
import { differenceInMilliseconds, format } from 'date-fns';
import { Clock, Flag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { OptimalCalendar } from '../../../../shared/components/ui/optimal-calendar';

export type RepetitionOption = 'once' | 'daily' | 'weekly' | 'custom';

interface TaskSchedulerProps {
  startDate?: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  repetition?: RepetitionOption;
  className?: string;
  onStartDateChange?: (date: Date) => void;
  onEndDateChange?: (date: Date) => void;
  onStartTimeChange?: (time: string) => void;
  onEndTimeChange?: (time: string) => void;
  onDurationChange?: (durationMs: number) => void;
  onRepetitionChange?: (repetition: RepetitionOption) => void;
}

export function TaskScheduler({
  startDate: initialStartDate,
  endDate: initialEndDate,
  startTime: initialStartTime,
  endTime: initialEndTime,
  repetition: initialRepetition = 'once',
  className,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onDurationChange,
  onRepetitionChange,
}: TaskSchedulerProps) {
  const [startDate, setStartDate] = useState<Date>(
    initialStartDate ? new Date(initialStartDate) : new Date(),
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialEndDate ? new Date(initialEndDate) : null,
  );
  const [startTime, setStartTime] = useState(initialStartTime || '');
  const [endTime, setEndTime] = useState(initialEndTime || '');
  const [repetition, setRepetition] = useState<RepetitionOption>(initialRepetition);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);
  const [isDurationPopoverOpen, setIsDurationPopoverOpen] = useState(false);
  const [customHours, setCustomHours] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [customDurationSet, setCustomDurationSet] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectTriggerRef = useRef<HTMLButtonElement>(null);
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number | null>(null);

  // Calculate initial duration from props when component mounts
  useEffect(() => {
    if (initialStartDate && initialEndDate && initialStartTime && initialEndTime) {
      try {
        // Create full date objects with time
        const [startHours, startMinutes] = initialStartTime.split(':').map(Number);
        const [endHours, endMinutes] = initialEndTime.split(':').map(Number);

        const startDateTime = new Date(initialStartDate);
        startDateTime.setHours(startHours, startMinutes, 0, 0);

        const endDateTime = new Date(initialEndDate);
        endDateTime.setHours(endHours, endMinutes, 0, 0);

        // Log initial values
        console.log('Initial End Time (Due Time):', initialEndTime);

        // Calculate duration in minutes
        const durationMs = differenceInMilliseconds(endDateTime, startDateTime);
        const durationMinutes = Math.round(durationMs / (60 * 1000));

        if (durationMinutes > 0) {
          // Set the custom duration minutes for potential editing
          setCustomDurationMinutes(durationMinutes);

          // Check if the duration matches one of our predefined options
          const predefinedDurations = Array.from({ length: 32 }, (_, i) => (i + 1) * 15);
          const isPredefined = predefinedDurations.includes(durationMinutes);

          if (isPredefined) {
            setSelectedDuration(durationMinutes.toString());
            setCustomDurationSet(false);
          } else {
            setSelectedDuration(`custom:${durationMinutes}`);
            setCustomDurationSet(true);
          }
        }
      } catch (error) {
        console.error('Error calculating initial duration:', error);
      }
    }
  }, [initialStartDate, initialEndDate, initialStartTime, initialEndTime]);

  // Pre-fill custom duration inputs when select opens and there's a custom duration
  useEffect(() => {
    if (isSelectOpen && customDurationSet && customDurationMinutes) {
      const hours = Math.floor(customDurationMinutes / 60);
      const minutes = customDurationMinutes % 60;

      setCustomHours(hours > 0 ? hours.toString() : '');
      setCustomMinutes(minutes > 0 ? minutes.toString() : '');
    }
  }, [isSelectOpen, customDurationSet, customDurationMinutes]);

  // Calculate duration when start or end time/date changes
  useEffect(() => {
    if (startDate && endDate && startTime && endTime) {
      try {
        // Create full date objects with time
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);

        const startDateTime = new Date(startDate);
        startDateTime.setHours(startHours, startMinutes, 0, 0);

        const endDateTime = new Date(endDate);
        endDateTime.setHours(endHours, endMinutes, 0, 0);

        // Log the due date values (endDate and endTime)
        console.log('Due Date:', endDate);
        console.log('Due Time:', endTime);

        // Calculate duration in milliseconds
        const durationMs = differenceInMilliseconds(endDateTime, startDateTime);

        // Check if end date/time is before start date/time
        if (durationMs <= 0) {
          setValidationError('End time cannot be before start time');
        } else {
          setValidationError(null);
          onDurationChange?.(durationMs);
        }
      } catch (error) {
        console.error('Error calculating duration:', error);
        setValidationError('Invalid date or time format');
      }
    }
  }, [startDate, endDate, startTime, endTime, onDurationChange]);

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    onStartTimeChange?.(time);
    console.log('Start Time:', time);
  };

  const handleEndTimeChange = (time: string) => {
    setEndTime(time);
    // Log the selected due time
    console.log('Due Time:', time);
    onEndTimeChange?.(time);
  };

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
    onStartDateChange?.(date);
    console.log('Start Date:', date);
  };

  const handleEndDateChange = (date: Date) => {
    setEndDate(date);
    // Log the selected due date
    console.log('Due Date:', date);
    onEndDateChange?.(date);
  };

  const handleRepetitionChange = (value: RepetitionOption) => {
    setRepetition(value);
    onRepetitionChange?.(value);
  };

  const handleDurationChange = (durationMinutes: number) => {
    // Simply notify parent about the duration change
    // No relationship with start/end dates
    console.log('Duration (minutes):', durationMinutes);
    onDurationChange?.(durationMinutes * 60 * 1000);

    // Close popover
    setIsDurationPopoverOpen(false);
  };

  const formatDurationDisplay = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours ? `${hours}h${mins ? ` ${mins}m` : ''}` : `${mins}m`;
  };

  const handleDurationSelectChange = (value: string) => {
    const minutes = parseInt(value, 10);
    if (!isNaN(minutes)) {
      handleDurationChange(minutes);
      setSelectedDuration(value);
      setCustomDurationSet(false);
    }
  };

  const handleCustomDurationSubmit = () => {
    const hours = parseInt(customHours, 10) || 0;
    const minutes = parseInt(customMinutes, 10) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes > 0) {
      handleDurationChange(totalMinutes);
      // Store total minutes for future editing
      setCustomDurationMinutes(totalMinutes);
      // Store total minutes as a special format to identify custom values
      setSelectedDuration(`custom:${totalMinutes}`);
      setCustomDurationSet(true);

      // Close the select menu
      setIsSelectOpen(false);
      // Unfocus any active element to ensure the select closes
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
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

  return (
    <div className="flex flex-col gap-1">
      <div className={cn('flex items-center gap-1.5', className)}>
        {/* Start Date and Time */}
        <Popover open={isStartDatePopoverOpen} onOpenChange={setIsStartDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-2 text-sm text-muted-foreground"
            >
              {startDate ? (
                <>
                  {format(startDate, 'MMM d')} at {startTime || format(new Date(), 'HH:mm')}
                </>
              ) : (
                format(new Date(), 'MMM d')
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
                onSelect={(date, time) => {
                  handleStartDateChange(date);
                  handleStartTimeChange(time);
                  setIsStartDatePopoverOpen(false);
                }}
                selected={{ date: startDate, time: startTime }}
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Duration Selection */}
        <div className="flex flex-col gap-1">
          <Select
            value={selectedDuration}
            onValueChange={handleDurationSelectChange}
            open={isSelectOpen}
            onOpenChange={setIsSelectOpen}
          >
            <SelectTrigger ref={selectTriggerRef} className="h-8 min-w-[120px]">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <SelectValue placeholder="Duration">
                  {selectedDuration && (
                    <>
                      {customDurationSet
                        ? formatDurationDisplay(parseInt(selectedDuration.split(':')[1], 10))
                        : formatDurationDisplay(parseInt(selectedDuration, 10))}
                    </>
                  )}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {/* Custom duration input at the top */}
              <div className="border-b border-border p-2">
                <div className="mb-1 text-xs text-muted-foreground">Custom duration (h:m):</div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5">
                    <Input
                      className="h-8 w-12 text-center text-xs"
                      placeholder="0"
                      value={customHours}
                      onChange={handleCustomHoursChange}
                      type="text"
                      inputMode="numeric"
                      onKeyDown={(e) => {
                        // Stop propagation to prevent select from handling the key events
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          handleCustomDurationSubmit();
                        }
                      }}
                      // Prevent select search/filtering behavior when typing
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm">h</span>
                  </div>
                  <span className="mx-1 text-sm">:</span>
                  <div className="flex items-center gap-0.5">
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
                        // Stop propagation to prevent select from handling the key events
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          handleCustomDurationSubmit();
                        }
                      }}
                      // Prevent select search/filtering behavior when typing
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm">m</span>
                  </div>
                  <Button
                    size="sm"
                    className="ml-2 h-8 px-2"
                    onClick={(e) => {
                      // Stop propagation to prevent the select from closing
                      e.stopPropagation();
                      handleCustomDurationSubmit();
                    }}
                  >
                    Set
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[220px]">
                <SelectGroup>
                  {Array.from({ length: 32 }, (_, i) => (i + 1) * 15).map((minutes) => {
                    const hours = Math.floor(minutes / 60);
                    const mins = minutes % 60;
                    const durationText = hours ? `${hours}h${mins ? ` ${mins}m` : ''}` : `${mins}m`;

                    return (
                      <SelectItem key={minutes} value={minutes.toString()}>
                        {durationText}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        {/* End Date and Time */}
        <Popover open={isEndDatePopoverOpen} onOpenChange={setIsEndDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-8 min-w-[100px] gap-1.5 px-2 text-sm',
                validationError ? 'border-red-500 text-red-500' : 'text-muted-foreground',
              )}
              title={validationError || ''}
            >
              {endDate ? (
                <>
                  {format(endDate, 'MMM d')} at {endTime || format(new Date(), 'HH:mm')}
                </>
              ) : (
                <span className="flex items-center justify-items-start gap-1 text-muted-foreground">
                  <Flag className="h-3.5 w-3.5" />
                  Due
                </span>
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
                onSelect={(date, time) => {
                  handleEndDateChange(date);
                  handleEndTimeChange(time);
                  setIsEndDatePopoverOpen(false);
                }}
                selected={{ date: endDate || new Date(), time: endTime }}
              />
            </div>
          </PopoverContent>
        </Popover>

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
    </div>
  );
}
