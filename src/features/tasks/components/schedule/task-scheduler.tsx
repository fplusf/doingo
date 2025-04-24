import { hasTimeOverlapWithExistingTasks } from '@/lib/task-utils';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { findFreeTimeSlots } from '@/shared/helpers/date/next-feefteen-minutes';
import { useStore } from '@tanstack/react-store';
import { format } from 'date-fns';
import { ArrowLeftRight, Clock, Flag } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  taskFormStore,
  updateDueDateTime,
  updateDuration,
  updateRepetition,
  updateStartDateTime,
} from '../../store/task-form.store';
// import { pushForwardAffectedTasks } from '../../store/tasks.store'; // Removed - Logic now handled by setFocused
import { useRouter } from '@tanstack/react-router';
import { DateTimePicker } from './date-time-picker';
import { DurationPicker } from './duration-picker';
import { RepetitionPicker } from './repetition-picker';

export type RepetitionOption = 'once' | 'daily' | 'weekly' | 'custom';

interface TaskSchedulerProps {
  className?: string;
  // Optional taskId only for checking overlaps with existing tasks
  taskId?: string;
}

export function TaskScheduler({ className, taskId }: TaskSchedulerProps) {
  // Use the store for all form values
  const startDate = useStore(taskFormStore, (state) => state.startDate);
  const startTime = useStore(taskFormStore, (state) => state.startTime);
  const duration = useStore(taskFormStore, (state) => state.duration);
  const dueDate = useStore(taskFormStore, (state) => state.dueDate);
  const dueTime = useStore(taskFormStore, (state) => state.dueTime);
  const repetition = useStore(taskFormStore, (state) => state.repetition);
  const currentTaskId = useStore(taskFormStore, (state) => state.taskId);

  // check if the component is used in a task document or in a task list
  const isTaskDocument = useRouter().state.location.pathname.includes('document');

  // Sync with task store when taskId changes or when task is updated
  useEffect(() => {
    if (taskId) {
      import('../../store/tasks.store').then(({ tasksStore }) => {
        const task = tasksStore.state.tasks.find((t) => t.id === taskId);
        if (task && taskId !== currentTaskId) {
          import('../../store/task-form.store').then(({ loadTaskForEditing }) => {
            loadTaskForEditing(task);
          });
        }
      });
    }
  }, [taskId, currentTaskId]);

  const [hasOverlap, setHasOverlap] = useState(false);
  const [showPushForwardPrompt, setShowPushForwardPrompt] = useState(false);
  const [freeTimeSlots, setFreeTimeSlots] = useState<string[]>([]);

  // Check for time overlap when start time or duration changes
  useEffect(() => {
    const taskDate = format(startDate, 'yyyy-MM-dd');
    const { hasOverlap: hasTimeOverlap } = hasTimeOverlapWithExistingTasks(
      startTime,
      duration,
      taskDate,
      taskId,
    );

    setHasOverlap(hasTimeOverlap);
  }, [startTime, duration, startDate, taskId]);

  // Check for available free time slots when duration changes
  useEffect(() => {
    const taskDate = format(startDate, 'yyyy-MM-dd');

    // Only look for free slots when we don't have a taskId (creating new task)
    if (!taskId) {
      const availableSlots = findFreeTimeSlots(taskDate, duration);
      setFreeTimeSlots(availableSlots);
    } else {
      setFreeTimeSlots([]);
    }
  }, [duration, startDate, taskId]);

  // Add a helper function to apply free time slot
  const applyFreeTimeSlot = (time: string) => {
    // Create a date object for the selected time
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(startDate);
    newDate.setHours(hours, minutes, 0, 0);

    // Apply the new time directly
    updateStartDateTime(newDate, time);
  };

  // Handlers for the component inputs
  const handleStartDateTimeChange = (date: Date, time: string) => {
    // For existing tasks
    if (taskId) {
      // Check if the date is changing
      const newTaskDate = format(date, 'yyyy-MM-dd');
      const currentTaskDate = format(startDate, 'yyyy-MM-dd');
      const isDateChanged = newTaskDate !== currentTaskDate;

      // Update the task form state
      updateStartDateTime(date, time);

      // If the task exists AND the date has changed, we need to update the task in the main store
      if (isDateChanged) {
        import('../../store/tasks.store').then(({ updateTaskStartDateTime }) => {
          // Update the task in the main store which will handle moving it to the new date
          updateTaskStartDateTime(taskId, date, time);

          // Clear any overlap indicators
          setHasOverlap(false);
          setShowPushForwardPrompt(false);
          setFreeTimeSlots([]);
        });
      }
    } else {
      // For new tasks, just update the form state
      updateStartDateTime(date, time);
    }
  };

  const handleDurationChange = (durationMs: number) => {
    updateDuration(durationMs);
  };

  const handleDueDateTimeChange = (date: Date | undefined, time: string) => {
    updateDueDateTime(date, time);
  };

  const handleRepetitionChange = (repetitionValue: RepetitionOption) => {
    updateRepetition(repetitionValue);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={cn('flex items-center gap-1.5', className)}>
        <DateTimePicker
          className="w-[8rem]"
          date={startDate}
          time={startTime}
          onChange={handleStartDateTimeChange}
          buttonLabel="Start"
        />

        <DurationPicker value={duration} onChange={handleDurationChange} />

        <DateTimePicker
          date={dueDate}
          time={dueTime}
          onChange={handleDueDateTimeChange}
          buttonLabel="Due"
          icon={<Flag className="h-3.5 w-3.5" />}
          isDue={true}
        />

        <RepetitionPicker value={repetition} onChange={handleRepetitionChange} />
      </div>

      {/* Show free time slot suggestions */}
      {freeTimeSlots.length > 0 && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-500">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Available free slot found</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[300px]">
              <p>
                There's an available free time slot between existing tasks where this task would
                fit.
              </p>
            </TooltipContent>
          </Tooltip>
          <button
            onClick={() => applyFreeTimeSlot(freeTimeSlots[0])}
            className="ml-auto flex items-center gap-1 text-xs text-blue-500 hover:underline"
          >
            <ArrowLeftRight className="h-3 w-3" />
            Add to free slot at {freeTimeSlots[0]}
          </button>
        </div>
      )}

      {/* {hasOverlap && !isTaskDocument && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-500">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                <span>Time slot overlaps with existing tasks</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[300px]">
              <p>
                This task overlaps with existing tasks. Consider changing the duration or selecting
                a different time block.
              </p>
            </TooltipContent>
          </Tooltip>
          <button
            onClick={() => setShowPushForwardPrompt(true)}
            className="ml-auto text-xs text-blue-500 hover:underline"
          >
            Push forward affected tasks
          </button>
        </div>
      )}

      {showPushForwardPrompt && (
        <div className="mt-1 rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-700">
          <p>This will move the overlapping tasks to start after this task finishes.</p>
          <div className="mt-1 flex justify-end gap-2">
            <button
              onClick={() => setShowPushForwardPrompt(false)}
              className="font-semibold hover:underline"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Logic removed - Handled by focusing the task if needed
                // if (taskId) {
                //   pushForwardAffectedTasks(taskId, startTime, duration, startDate);
                // }
                setShowPushForwardPrompt(false);
                setHasOverlap(false); // Assume pushing resolves the overlap
              }}
              className="font-semibold text-blue-600 hover:underline"
            >
              Confirm
            </button>
          </div>
        </div>
      )} */}
    </div>
  );
}
