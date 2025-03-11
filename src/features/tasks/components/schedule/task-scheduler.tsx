import { cn } from '@/lib/utils';
import { useStore } from '@tanstack/react-store';
import {
  getTaskSchedulingInfo,
  tasksStore,
  updateTaskDueDateTime,
  updateTaskDuration,
  updateTaskRepetition,
  updateTaskStartDateTime,
} from '../../store/tasks.store';
import { DateTimePicker } from './date-time-picker';
import { DurationPicker } from './duration-picker';
import { RepetitionPicker } from './repetition-picker';

export type RepetitionOption = 'once' | 'daily' | 'weekly' | 'custom';

interface TaskSchedulerProps {
  className?: string;
  taskId?: string; // ID of the task being edited, null for new tasks
}

export function TaskScheduler({ className, taskId }: TaskSchedulerProps) {
  // Use store for getting task data - avoid conditional hook calls
  const taskData = useStore(tasksStore, (state) => {
    if (!taskId) return null;
    return getTaskSchedulingInfo(taskId);
  });

  // Get the editingTaskId from the store
  const editingTaskId = useStore(tasksStore, (state) => state.editingTaskId);

  // Determine the active task ID (either the provided taskId or the one being edited)
  const activeTaskId = taskId || editingTaskId;

  // If no task data and not editing a task, we'll use default values
  const defaultStartTime = new Date();
  const defaultStartTimeString = `${defaultStartTime.getHours().toString().padStart(2, '0')}:${defaultStartTime.getMinutes().toString().padStart(2, '0')}`;

  // Extract values from task data or use defaults
  const startDate = taskData?.startDate || defaultStartTime;
  const startTime = taskData?.startTime || defaultStartTimeString;
  const dueDate = taskData?.dueDate;
  const dueTime = taskData?.dueTime || '';
  const duration = taskData?.duration || 60 * 60 * 1000; // Default to 1 hour
  const repetition = taskData?.repetition || 'once';

  const handleRepetitionChange = (value: RepetitionOption) => {
    if (activeTaskId) {
      updateTaskRepetition(activeTaskId, value);
    }
  };

  const handleStartDateSelection = (date: Date, time: string) => {
    if (activeTaskId) {
      updateTaskStartDateTime(activeTaskId, date, time);
    }
  };

  const handleDueDateSelection = (date: Date, time: string) => {
    if (activeTaskId) {
      updateTaskDueDateTime(activeTaskId, date, time);
    }
  };

  const handleDurationChange = (durationMs: number) => {
    if (activeTaskId) {
      updateTaskDuration(activeTaskId, durationMs);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={cn('flex items-center gap-1.5', className)}>
        <DateTimePicker
          date={startDate}
          time={startTime}
          onChange={handleStartDateSelection}
          buttonLabel="Start"
        />

        <DurationPicker value={duration} onChange={handleDurationChange} />

        <DateTimePicker
          date={dueDate}
          time={dueTime}
          onChange={handleDueDateSelection}
          buttonLabel="Due"
          showBellIcon={true}
          isDue={true}
        />

        <RepetitionPicker value={repetition} onChange={handleRepetitionChange} />
      </div>
    </div>
  );
}
