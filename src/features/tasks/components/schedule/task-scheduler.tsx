import { cn } from '@/lib/utils';
import { useTaskForm } from '../../context/task-form-context';
import { DateTimePicker } from './date-time-picker';
import { DurationPicker } from './duration-picker';
import { RepetitionPicker } from './repetition-picker';

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

  const handleRepetitionChange = (value: RepetitionOption) => {
    updateValue('repetition', value);
  };

  const handleStartDateSelection = (date: Date, time: string) => {
    updateStartDate(date);
    updateStartTime(time);
  };

  const handleDueDateSelection = (date: Date, time: string) => {
    updateDueDate(date);
    updateDueTime(time);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={cn('flex items-center gap-1.5', className)}>
        <DateTimePicker
          date={values.startDate}
          time={values.startTime}
          onChange={handleStartDateSelection}
          buttonLabel="Start"
        />

        <DurationPicker
          value={values.duration}
          onChange={(durationMs: number) => updateDuration(durationMs)}
        />

        <DateTimePicker
          date={values.dueDate}
          time={values.dueTime}
          onChange={handleDueDateSelection}
          buttonLabel="Due"
          showBellIcon={true}
          isDue={true}
        />

        <RepetitionPicker value={values.repetition || 'once'} onChange={handleRepetitionChange} />
      </div>
    </div>
  );
}
