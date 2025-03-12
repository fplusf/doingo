import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import {
  findFreeTimeSlots,
  hasTimeOverlapWithExistingTasks,
} from '@/shared/helpers/date/next-feefteen-minutes';
import { useStore } from '@tanstack/react-store';
import { format, parse } from 'date-fns';
import { AlertCircle, ArrowLeftRight, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getDefaultStartTime,
  getTaskSchedulingInfo,
  pushForwardAffectedTasks,
  tasksStore,
  updateDraftTaskDueDateTime,
  updateDraftTaskDuration,
  updateDraftTaskRepetition,
  updateDraftTaskStartDateTime,
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
  taskId?: string; // ID of the task being edited, or "draft" for new tasks
  isDraft?: boolean; // Whether we're working with a draft task
}

export function TaskScheduler({ className, taskId, isDraft = false }: TaskSchedulerProps) {
  // Determine the appropriate taskId to use
  const effectiveTaskId = isDraft ? 'draft' : taskId;
  const [hasOverlap, setHasOverlap] = useState(false);
  const [showPushForwardPrompt, setShowPushForwardPrompt] = useState(false);
  const [freeTimeSlots, setFreeTimeSlots] = useState<string[]>([]);

  // Add debug logging of the full draft task
  useEffect(() => {
    if (isDraft) {
      const draftTask = tasksStore.state.draftTask;
      console.log('Current draft task in TaskScheduler:', draftTask);
    }
  }, [isDraft, tasksStore.state.draftTask]);

  // Use store for getting task data - avoid conditional hook calls
  const taskData = useStore(tasksStore, (state) => {
    // If no taskId and not a draft, return null
    if (!effectiveTaskId) return null;

    return getTaskSchedulingInfo(effectiveTaskId);
  });

  // Get the editingTaskId from the store (used as fallback if no taskId provided)
  const editingTaskId = useStore(tasksStore, (state) => state.editingTaskId);

  // Determine the active task ID (either the provided taskId, draft, or the one being edited)
  const activeTaskId = effectiveTaskId || editingTaskId;

  // Generate the proper default time values using the helper functions
  const defaultStartTimeString = getDefaultStartTime();
  // Parse the default start time string into a Date
  const defaultStartTime = parse(defaultStartTimeString, 'HH:mm', new Date());

  // Extract values from task data or use defaults
  const startDate = taskData?.startDate || defaultStartTime;
  const startTime = taskData?.startTime || defaultStartTimeString;
  const dueDate = taskData?.dueDate;
  const dueTime = taskData?.dueTime || '';
  const duration = taskData?.duration || 60 * 60 * 1000; // Default to 1 hour
  const repetition = taskData?.repetition || 'once';

  // Check for time overlap when start time or duration changes
  useEffect(() => {
    if (!activeTaskId) return;

    const taskDate = format(startDate, 'yyyy-MM-dd');
    const { hasOverlap: hasTimeOverlap } = hasTimeOverlapWithExistingTasks(
      startTime,
      duration,
      taskDate,
      isDraft ? undefined : activeTaskId,
    );

    setHasOverlap(hasTimeOverlap);
  }, [activeTaskId, startTime, duration, startDate, isDraft]);

  // Check for available free time slots when duration changes
  useEffect(() => {
    if (!activeTaskId) return;

    const taskDate = format(startDate, 'yyyy-MM-dd');

    // Only look for free slots when creating a new task (draft mode)
    if (isDraft) {
      const availableSlots = findFreeTimeSlots(taskDate, duration);
      setFreeTimeSlots(availableSlots);
    } else {
      setFreeTimeSlots([]);
    }
  }, [activeTaskId, duration, startDate, isDraft]);

  const handleRepetitionChange = (value: RepetitionOption) => {
    if (!activeTaskId) return;

    if (isDraft || activeTaskId === 'draft') {
      updateDraftTaskRepetition(value);
    } else if (typeof activeTaskId === 'string') {
      updateTaskRepetition(activeTaskId, value);
    }
  };

  const handleStartDateSelection = (date: Date, time: string) => {
    if (!activeTaskId) return;

    if (isDraft || activeTaskId === 'draft') {
      updateDraftTaskStartDateTime(date, time);
    } else if (typeof activeTaskId === 'string') {
      updateTaskStartDateTime(activeTaskId, date, time);
    }
  };

  const handleDueDateSelection = (date: Date, time: string) => {
    if (!activeTaskId) return;

    console.log('handleDueDateSelection called with:', { date, time, isDraft, activeTaskId });

    if (isDraft || activeTaskId === 'draft') {
      updateDraftTaskDueDateTime(date, time);
      // Verify the update worked
      setTimeout(() => {
        console.log('Draft after due date update:', tasksStore.state.draftTask);
      }, 100);
    } else if (typeof activeTaskId === 'string') {
      updateTaskDueDateTime(activeTaskId, date, time);
    }
  };

  const handleDurationChange = (durationMs: number) => {
    if (!activeTaskId) return;

    console.log('handleDurationChange called with:', { durationMs, isDraft, activeTaskId });

    if (isDraft || activeTaskId === 'draft') {
      updateDraftTaskDuration(durationMs);
      // Verify the update worked
      setTimeout(() => {
        console.log('Draft after duration update:', tasksStore.state.draftTask);
      }, 100);
    } else if (typeof activeTaskId === 'string') {
      updateTaskDuration(activeTaskId, durationMs);
    }
  };

  // Add a helper function to apply free time slot
  const applyFreeTimeSlot = (time: string) => {
    if (!activeTaskId) return;

    // Create a date object for the selected time
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(startDate);
    newDate.setHours(hours, minutes, 0, 0);

    // Apply the new time
    handleStartDateSelection(newDate, time);
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

      {hasOverlap && (
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
          <p className="mb-1">
            This will reschedule all affected tasks to start after this task's end time. Continue?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowPushForwardPrompt(false)}
              className="rounded bg-gray-200 px-2 py-1 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Call the push forward function and then hide the prompt
                if (activeTaskId) {
                  pushForwardAffectedTasks(activeTaskId, startTime, duration, startDate);
                  setShowPushForwardPrompt(false);
                  setHasOverlap(false); // Reset the overlap state since we've resolved it
                }
              }}
              className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
