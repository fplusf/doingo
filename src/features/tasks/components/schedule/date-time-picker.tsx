import { taskFormStore } from '@/features/tasks/stores/task-form.store';
import {
  updateTaskDueDateTime,
  updateTaskStartDateTime,
} from '@/features/tasks/stores/tasks.store';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { useStore } from '@tanstack/react-store';
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
  className?: string;
  timeInterval?: number;
  isStartTimePicker?: boolean;
}

export function DateTimePicker({
  className,
  date,
  time,
  onChange,
  placeholder = 'Select date',
  icon = <CalendarIcon className="h-3.5 w-3.5" />,
  buttonLabel,
  isDue = false,
  timeInterval,
  isStartTimePicker,
}: DateTimeSelectorProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Get the task ID from the store for central store updates
  const taskId = useStore(taskFormStore, (state) => state.taskId);

  const handleDateTimeSelection = (selectedDate: Date, selectedTime: string) => {
    // Call the parent component's onChange handler
    onChange(selectedDate, selectedTime);

    // If we have a task ID, also update the central task store immediately
    if (taskId) {
      if (isDue) {
        // Update due date/time in the central store
        updateTaskDueDateTime(taskId, selectedDate, selectedTime);
      } else {
        // Update start date/time in the central store
        updateTaskStartDateTime(taskId, selectedDate, selectedTime);
      }
    }

    setIsPopoverOpen(false);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-8 gap-1.5 px-2 text-sm text-muted-foreground', className)}
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
            timeInterval={timeInterval}
            isStartTimePicker={isStartTimePicker}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
