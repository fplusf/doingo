import { tasksStore, updateTask, updateTaskTimeSpent } from '@/features/tasks/stores/tasks.store';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { useStore } from '@tanstack/react-store';
import { Check, Pause, Pencil, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../../../lib/utils';

interface TaskTimerProps {
  taskId: string;
  initialTimeSpent: number;
  className?: string;
  editable?: boolean;
}

export const TaskTimer = ({
  taskId,
  initialTimeSpent,
  className,
  editable = false,
}: TaskTimerProps) => {
  // Local display time for UI updates
  const [displayTime, setDisplayTime] = useState(initialTimeSpent);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  // Non-reactive refs to avoid triggering renders
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const isRunningRef = useRef(false);

  // Read current state from store
  const currentTimerState = useStore(tasksStore, (state) => state.timerStates?.[taskId] || null);

  // Get the task from store to check if it's focused
  const task = useStore(tasksStore, (state) => state.tasks.find((t) => t.id === taskId));
  const isFocused = task?.isFocused || false;

  // Safe initialization - only run once on mount
  useEffect(() => {
    // Clean up any lingering intervals just to be safe
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Effect to stop timer if task is unfocused
  useEffect(() => {
    // If task is no longer focused but timer is running, stop it
    if (!isFocused && currentTimerState?.isRunning) {
      tasksStore.setState((state) => {
        const newTimerStates = {
          ...state.timerStates,
          [taskId]: { isRunning: false, lastUpdatedAt: currentTimerState.lastUpdatedAt },
        };
        return {
          ...state,
          timerStates: newTimerStates,
        };
      });
    }
  }, [isFocused, currentTimerState?.isRunning, taskId]);

  // Set up timer when running status changes
  useEffect(() => {
    // Skip if timer state doesn't exist
    if (!currentTimerState) return;

    const { isRunning, lastUpdatedAt } = currentTimerState;

    // Only allow the timer to run if the task is focused
    const shouldBeRunning = isRunning && isFocused;

    isRunningRef.current = shouldBeRunning;

    // Clean up existing interval if any
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start new interval if running and task is focused
    if (shouldBeRunning && lastUpdatedAt) {
      startTimeRef.current = lastUpdatedAt;

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setDisplayTime(initialTimeSpent + elapsed);
      }, 100);
    } else {
      // Update display time to current value
      setDisplayTime(initialTimeSpent);
    }

    // Clean up on unmount or when deps change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;

        // Save elapsed time if the timer was running
        if (isRunningRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          if (elapsed > 0) {
            updateTaskTimeSpent(taskId, elapsed);
          }
        }
      }
    };
  }, [
    currentTimerState?.isRunning,
    currentTimerState?.lastUpdatedAt,
    initialTimeSpent,
    taskId,
    isFocused,
  ]);

  // Handle toggle without causing unnecessary renders
  const handleToggle = () => {
    // Don't allow toggling in edit mode or when task is not focused
    if (isEditing) return;

    // Only allow starting the timer if the task is focused
    if (!isFocused) return;

    const willBeRunning = !(currentTimerState?.isRunning || false);

    // Update the store - avoid setting state that causes re-renders in the component
    tasksStore.setState((state) => {
      return {
        ...state,
        timerStates: {
          ...state.timerStates,
          [taskId]: {
            isRunning: willBeRunning,
            lastUpdatedAt: willBeRunning ? Date.now() : currentTimerState?.lastUpdatedAt || 0,
          },
        },
      };
    });
  };

  // Format display time as string
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Enter edit mode
  const handleEditClick = () => {
    // Stop timer if it's running
    if (currentTimerState?.isRunning) {
      tasksStore.setState((state) => ({
        ...state,
        timerStates: {
          ...state.timerStates,
          [taskId]: {
            isRunning: false,
            lastUpdatedAt: currentTimerState.lastUpdatedAt,
          },
        },
      }));
    }

    // Set initial values for edit fields
    const totalSeconds = Math.floor(displayTime / 1000);
    setHours(Math.floor(totalSeconds / 3600));
    setMinutes(Math.floor((totalSeconds % 3600) / 60));
    setSeconds(totalSeconds % 60);

    // Enter edit mode
    setIsEditing(true);
  };

  // Save edited time
  const handleSaveEdit = () => {
    // Calculate time in milliseconds
    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;

    // Update task's time spent directly using updateTask which persists to localStorage
    updateTask(taskId, { timeSpent: totalMs });

    // Also update the timer state
    tasksStore.setState((state) => ({
      ...state,
      timerStates: {
        ...state.timerStates,
        [taskId]: {
          isRunning: false,
          lastUpdatedAt: Date.now(),
        },
      },
    }));

    // Update display time
    setDisplayTime(totalMs);

    // Exit edit mode
    setIsEditing(false);
  };

  // Validate and limit input to numbers
  const handleInputChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<number>>,
    max: number,
  ) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= max) {
      setter(parsed);
    }
  };

  // Extract isRunning state for the UI
  const isRunning = currentTimerState?.isRunning || false;

  // Determine if the play button should be disabled (when task is not focused)
  const isPlayDisabled = !isFocused;

  // Render timer with proper DOM nesting
  return (
    <TooltipProvider>
      <Tooltip>
        <div className={cn('flex items-center gap-2', className)}>
          {isEditing ? (
            // Edit mode
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                max="99"
                value={hours}
                onChange={(e) => handleInputChange(e.target.value, setHours, 99)}
                className="h-6 w-10 px-1 font-mono text-xs"
                aria-label="Hours"
              />
              <span className="text-xs">:</span>
              <Input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => handleInputChange(e.target.value, setMinutes, 59)}
                className="h-6 w-10 px-1 font-mono text-xs"
                aria-label="Minutes"
              />
              <span className="text-xs">:</span>
              <Input
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => handleInputChange(e.target.value, setSeconds, 59)}
                className="h-6 w-10 px-1 font-mono text-xs"
                aria-label="Seconds"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleSaveEdit}
                aria-label="Save edited time"
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            // Display mode
            <>
              <div className="flex h-6 min-w-[4.5rem] items-center justify-center rounded-md bg-gray-800/80 px-2 py-1 font-mono text-xs font-medium tabular-nums text-white">
                {formatTime(displayTime)}
              </div>

              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-6 w-6',
                    isPlayDisabled && !isRunning ? 'cursor-not-allowed opacity-40' : '',
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle();
                  }}
                  disabled={isPlayDisabled && !isRunning}
                  aria-label={isRunning ? 'Pause timer' : 'Start timer'}
                >
                  {isRunning ? (
                    <Pause className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Play className="h-3 w-3" aria-hidden="true" />
                  )}
                </Button>
              </TooltipTrigger>

              {editable && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleEditClick}
                  aria-label="Edit time"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </>
          )}

          {!isEditing && (
            <TooltipContent>
              <p>
                {isRunning
                  ? 'Pause timer'
                  : isPlayDisabled
                    ? 'Timer only works in focused mode'
                    : 'Start timer'}
              </p>
            </TooltipContent>
          )}
        </div>
      </Tooltip>
    </TooltipProvider>
  );
};
