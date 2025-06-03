import { batchPredictTaskProperties } from '@/lib/groq-service';
import { hasTimeOverlapWithExistingTasks } from '@/lib/task-utils';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { findFreeTimeSlots } from '@/shared/helpers/date/next-feefteen-minutes';
import { useStore } from '@tanstack/react-store';
import { format } from 'date-fns';
import { Clock, Flag, Info } from 'lucide-react';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  taskFormStore,
  updateDueDateTime,
  updateDuration,
  updateStartDateTime,
  updateTimeFixed,
} from '../../stores/task-form.store';
// import { pushForwardAffectedTasks } from '../../store/tasks.store'; // Removed - Logic now handled by setFocused
import { useRouter, useSearch } from '@tanstack/react-router';
import { useHotkeys } from 'react-hotkeys-hook';
import { ONE_HOUR_IN_MS } from '../../types';
import { DateTimePicker } from './date-time-picker';
import { DurationPicker } from './duration-picker';

export interface TaskSchedulerHandle {
  triggerAiEstimationNow: () => Promise<void>;
}

interface TaskSchedulerProps {
  className?: string;
  // Optional taskId only for checking overlaps with existing tasks
  taskId?: string;
  // New prop to indicate if AI is estimating the duration
  isEstimating?: boolean;
  onRequestAiEstimate?: () => Promise<void>;
  taskTitle?: string;
  // New prop to track if dialog is still active
  isDialogActive?: boolean;
}

export const TaskScheduler = React.forwardRef<TaskSchedulerHandle, TaskSchedulerProps>(
  (
    {
      className,
      taskId,
      isEstimating: внешнееIsEstimating,
      onRequestAiEstimate,
      taskTitle,
      isDialogActive,
    },
    ref,
  ) => {
    // Use the store for all form values
    const formStoreStartDate = useStore(taskFormStore, (state) => state.startDate);
    const startTime = useStore(taskFormStore, (state) => state.startTime);
    const duration = useStore(taskFormStore, (state) => state.duration);
    const dueDate = useStore(taskFormStore, (state) => state.dueDate);
    const dueTime = useStore(taskFormStore, (state) => state.dueTime);
    const currentFormTaskId = useStore(taskFormStore, (state) => state.taskId);
    const formMode = useStore(taskFormStore, (state) => state.mode);
    const isFormDirty = useStore(taskFormStore, (state) => state.isDirty);
    const isTimeFixed = useStore(taskFormStore, (state) => state.isTimeFixed);

    // State for AI estimation
    const [isAiEstimating, setIsAiEstimating] = useState(false);
    const [currentTaskTitleForAi, setCurrentTaskTitleForAi] = useState(taskTitle);
    const [lastSuccessfullyProcessedAiTitle, setLastSuccessfullyProcessedAiTitle] = useState<
      string | null
    >(null);
    const debounceTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);

    // Get date from URL search parameters
    const searchParams = useSearch({ from: '/tasks' }); // Changed from '/' to '/tasks'
    const dateStringFromUrl = searchParams.date;

    // check if the component is used in a task document or in a task list
    const isTaskDocument = useRouter().state.location.pathname.includes('document');

    // Effect to initialize startDate in form store from URL for new tasks
    useEffect(() => {
      if (formMode === 'create' && !currentFormTaskId && !isFormDirty && dateStringFromUrl) {
        // Only run if in create mode, no task is loaded in form, form is not dirty,
        // and there is a date string from the URL.
        import('../../stores/task-form.store').then(({ initializeStartDateForCreateForm }) => {
          initializeStartDateForCreateForm(dateStringFromUrl);
        });
      }
      // Dependencies: formMode, currentFormTaskId, isFormDirty, and dateStringFromUrl.
      // These ensure the effect runs if any of these relevant conditions change.
    }, [formMode, currentFormTaskId, isFormDirty, dateStringFromUrl]);

    // Effect to reset manual override flags when taskTitle prop changes
    useEffect(() => {
      // Skip in edit mode
      if (formMode === 'edit' || currentFormTaskId) {
        return;
      }

      if (taskTitle !== currentTaskTitleForAi) {
        taskFormStore.setState((state) => ({
          ...state,
          isDurationManuallySet: false,
          isPriorityManuallySet: false,
        }));
        setCurrentTaskTitleForAi(taskTitle);
        setLastSuccessfullyProcessedAiTitle(null); // Allow AI to run for new title
      }
    }, [taskTitle, currentTaskTitleForAi, formMode, currentFormTaskId]);

    const triggerAiEstimationNow = async (): Promise<void> => {
      // Skip AI estimation in edit mode
      if (formMode === 'edit' || currentFormTaskId) {
        return Promise.resolve();
      }

      if (debounceTimeoutIdRef.current) {
        clearTimeout(debounceTimeoutIdRef.current);
        debounceTimeoutIdRef.current = null;
      }

      if (
        !currentTaskTitleForAi ||
        currentTaskTitleForAi.trim().length < 5 ||
        isAiEstimating ||
        currentTaskTitleForAi === lastSuccessfullyProcessedAiTitle
      ) {
        return Promise.resolve();
      }

      setIsAiEstimating(true);
      try {
        const {
          duration: estimatedDuration,
          priority: estimatedPriority,
          emoji: estimatedEmoji,
        } = await batchPredictTaskProperties(currentTaskTitleForAi);

        // Update state using the store's setState pattern
        taskFormStore.setState((state) => {
          // GUARD: Only update if dialog is still active (when called from dialog)
          if (isDialogActive !== undefined && !isDialogActive) {
            console.log('Skipping AI batch update - dialog is no longer active');
            return state; // Return unchanged state
          }

          const newState = { ...state, isDirty: true };

          // Only update fields if they haven't been manually set
          if (!state.isDurationManuallySet) {
            newState.duration = estimatedDuration;
          }
          if (!state.isPriorityManuallySet) {
            newState.priority = estimatedPriority;
          }
          if (estimatedEmoji && !state.isEmojiSetByAi) {
            newState.emoji = estimatedEmoji;
            newState.isEmojiSetByAi = true;
          }

          return newState;
        });

        setLastSuccessfullyProcessedAiTitle(currentTaskTitleForAi);
      } catch (err) {
        console.error('Error in AI estimation:', err);
      } finally {
        setIsAiEstimating(false);
      }
    };

    useImperativeHandle(ref, () => ({
      triggerAiEstimationNow,
    }));

    // Debounced AI estimation trigger
    useEffect(() => {
      // Skip AI estimation in edit mode
      if (formMode === 'edit' || currentFormTaskId) {
        return;
      }

      if (currentTaskTitleForAi && currentTaskTitleForAi.trim().length >= 5) {
        if (debounceTimeoutIdRef.current) {
          clearTimeout(debounceTimeoutIdRef.current);
        }
        debounceTimeoutIdRef.current = setTimeout(() => {
          triggerAiEstimationNow();
        }, 2000);
      }
      return () => {
        if (debounceTimeoutIdRef.current) {
          clearTimeout(debounceTimeoutIdRef.current);
        }
      };
    }, [currentTaskTitleForAi, formMode, currentFormTaskId]); // Added formMode and currentFormTaskId to dependencies

    // Sync with task store when prop taskId changes or when task is updated
    useEffect(() => {
      if (taskId && taskId !== currentFormTaskId) {
        // if a task ID is passed via props
        import('../../stores/tasks.store').then(({ tasksStore }) => {
          const task = tasksStore.state.tasks.find((t) => t.id === taskId);
          if (task) {
            import('../../stores/task-form.store').then(({ loadTaskForEditing }) => {
              loadTaskForEditing(task);
            });
          }
        });
      }
    }, [taskId, currentFormTaskId]);

    const [hasOverlap, setHasOverlap] = useState(false);
    const [showPushForwardPrompt, setShowPushForwardPrompt] = useState(false);
    const [freeTimeSlots, setFreeTimeSlots] = useState<string[]>([]);

    // Check for time overlap when start time or duration changes
    useEffect(() => {
      const taskDate = format(formStoreStartDate, 'yyyy-MM-dd');
      const { hasOverlap: hasTimeOverlap } = hasTimeOverlapWithExistingTasks(
        startTime,
        duration,
        taskDate,
        taskId,
      );

      setHasOverlap(hasTimeOverlap);
    }, [startTime, duration, formStoreStartDate, taskId]);

    // Check for available free time slots when duration changes
    useEffect(() => {
      const taskDate = format(formStoreStartDate, 'yyyy-MM-dd');

      // Only look for free slots when we don't have a taskId (creating new task)
      if (!taskId) {
        const availableSlots = findFreeTimeSlots(taskDate, duration);
        setFreeTimeSlots(availableSlots);
      } else {
        setFreeTimeSlots([]);
      }
    }, [duration, formStoreStartDate, taskId]);

    // Add hotkey handler for 'A' key
    useHotkeys(
      'a',
      (e) => {
        e.preventDefault();
        if (!taskId && freeTimeSlots.length > 0) {
          const taskValues = {
            title: taskTitle || 'New Task',
            duration: ONE_HOUR_IN_MS,
          };

          import('../../stores/tasks.store').then(({ createTaskInFreeSlotWithHotkey }) => {
            createTaskInFreeSlotWithHotkey(taskValues);
          });
        }
      },
      [taskId, freeTimeSlots, taskTitle],
    );

    // Handlers for the component inputs
    const handleStartDateTimeChange = (date: Date, time: string) => {
      // For existing tasks
      if (taskId) {
        // Check if the date is changing
        const newTaskDate = format(date, 'yyyy-MM-dd');
        const currentTaskDate = format(formStoreStartDate, 'yyyy-MM-dd');
        const isDateChanged = newTaskDate !== currentTaskDate;
        const isTimeChanged = time !== startTime;

        // Update the task form state
        updateStartDateTime(date, time);

        // Update the task in the main store regardless if date or time changed
        // This ensures real-time updates in the tasks list
        if (isDateChanged || isTimeChanged) {
          import('../../stores/tasks.store').then(({ updateTaskStartDateTime }) => {
            // Update the task in the main store which will handle moving it to the new date
            // or reordering within the same date
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

    const handleDurationChange = (newDuration: number) => {
      updateDuration(newDuration);
      taskFormStore.setState((state) => ({ ...state, isDurationManuallySet: true, isDirty: true }));
    };

    const handleDueDateTimeChange = (date: Date | undefined, time: string) => {
      updateDueDateTime(date, time);
    };

    return (
      <div className="flex flex-col gap-1">
        <div className={cn('flex items-center gap-1.5', className)}>
          <DateTimePicker
            className="w-[8rem]"
            date={formStoreStartDate}
            time={startTime}
            onChange={handleStartDateTimeChange}
            buttonLabel="Start"
            timeInterval={5}
            isStartTimePicker={true}
          />

          <DurationPicker
            value={duration}
            onChange={handleDurationChange}
            isEstimating={isAiEstimating || внешнееIsEstimating}
            taskTitle={currentTaskTitleForAi}
          />

          <DateTimePicker
            date={dueDate}
            time={dueTime}
            onChange={handleDueDateTimeChange}
            buttonLabel="Due"
            icon={<Flag className="h-3.5 w-3.5" />}
            isDue={true}
          />

          <div className="flex items-center gap-1.5">
            <Checkbox
              id="isTimeFixed"
              checked={isTimeFixed}
              onCheckedChange={(checked) => updateTimeFixed(checked as boolean)}
              className="data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500"
            />
            <div className="flex items-center gap-1">
              <label
                htmlFor="isTimeFixed"
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Time sensitive
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="group">
                    <Info className="h-2 w-2 text-muted-foreground transition-colors group-hover:text-muted-foreground/80" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[150px] p-2" side="bottom">
                  <p className="text-[10px] leading-normal">
                    To prevent its start time from being adjusted by overlap resolvers
                  </p>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* TODO: Enable and develop once the idea is validated */}
          {/* <RepetitionPicker
            frequency={repetition}
            onFrequencyChange={handleRepetitionChange}
            repeatInterval={repeatInterval}
            onRepeatIntervalChange={handleRepeatIntervalChange}
            repeatStartDate={startDate}
            onRepeatStartDateChange={handleStartDateChange}
            repeatEndDate={dueDate}
            onRepeatEndDateChange={handleEndDateChange}
          /> */}
        </div>

        {freeTimeSlots.length > 0 && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-500">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Press 'A' to add task in free slot</span>
            </div>
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
  },
);

// Add display name for better debugging
TaskScheduler.displayName = 'TaskScheduler';
