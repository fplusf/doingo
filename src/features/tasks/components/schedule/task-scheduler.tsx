import { cn } from '@/lib/utils';
import { useStore } from '@tanstack/react-store';
import { useEffect } from 'react';
import {
  getTaskSchedulingInfo,
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
