import {
  tasksStore,
  toggleTaskTimer,
  updateTaskTimeSpent,
} from '@/features/tasks/store/tasks.store';
import { Button } from '@/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { useStore } from '@tanstack/react-store';
import { Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../../../lib/utils';

interface TaskTimerProps {
  taskId: string;
  initialTimeSpent: number;
  className?: string;
}

export function TaskTimer({ taskId, initialTimeSpent, className }: TaskTimerProps) {
  const timerState = useStore(
    tasksStore,
    (state) => state.timerStates[taskId] || { isRunning: false, lastUpdatedAt: 0 },
  );

  const intervalRef = useRef<number | null>(null);
  // Ref for the time displayed in the UI. Starts with DB time.
  const displayTimeRef = useRef<number>(initialTimeSpent);
  // Ref for the timestamp of the last interval update or start/resume.
  const lastUpdateTimeRef = useRef<number>(0);

  // State for forcing UI updates
  const [, setUpdateCounter] = useState(0);
  const forceUpdate = useCallback(() => setUpdateCounter((c) => c + 1), []);

  // --- Initialization: Handle persisted state on mount ---
  useEffect(() => {
    // Start display with the time saved before this session
    displayTimeRef.current = initialTimeSpent;

    if (timerState.isRunning && timerState.lastUpdatedAt > 0) {
      // Calculate time elapsed since the timer state was last saved (i.e., during reload)
      const elapsedSinceLastSave = Date.now() - timerState.lastUpdatedAt;
      if (elapsedSinceLastSave > 0) {
        // Add this "missed" time ONLY to the display for continuity
        displayTimeRef.current += elapsedSinceLastSave;
        // Set the last update time to NOW, marking the actual resume time
        lastUpdateTimeRef.current = Date.now();
      }
    } else {
      // Ensure display matches initial time if not running
      displayTimeRef.current = initialTimeSpent;
      lastUpdateTimeRef.current = 0;
    }

    // Update the UI immediately with the potentially adjusted display time
    forceUpdate();

    // --- Cleanup on unmount ---
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        // If it was running upon unmount, save the final delta
        if (timerState.isRunning && lastUpdateTimeRef.current > 0) {
          const elapsed = Date.now() - lastUpdateTimeRef.current;
          if (elapsed > 0) {
            // Save only the time since the last update/resume
            updateTaskTimeSpent(taskId, elapsed);
          }
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]); // Rerun if taskId changes (though unlikely in this component structure)

  // --- Setup/Teardown Interval based on running state ---
  useEffect(() => {
    if (timerState.isRunning) {
      // Timer is starting or resuming. Set the reference time for delta calculation.
      lastUpdateTimeRef.current = Date.now();

      // Clear potentially existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        // Calculate time since the last tick/update
        const elapsedSinceLastTick = now - lastUpdateTimeRef.current;

        if (elapsedSinceLastTick > 0) {
          // Add delta to display and update the reference time
          displayTimeRef.current += elapsedSinceLastTick;
          lastUpdateTimeRef.current = now;
          forceUpdate(); // Update UI
        }
      }, 100); // Update every 100ms
    } else {
      // Timer is stopping
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;

        // Save the final elapsed time since the last update/resume
        if (lastUpdateTimeRef.current > 0) {
          const elapsed = Date.now() - lastUpdateTimeRef.current;
          if (elapsed > 0) {
            // Save only the delta
            updateTaskTimeSpent(taskId, elapsed);
            // Ensure display reflects final delta (optional but good practice)
            // displayTimeRef.current += elapsed; // Already added by last tick potentially
            // forceUpdate();
          }
        }
        // Reset last update time as timer is stopped
        lastUpdateTimeRef.current = 0;
      }
    }

    // Cleanup interval on state change or unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState.isRunning, taskId, forceUpdate]); // Include forceUpdate

  // --- Format time ---
  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- Toggle timer state ---
  const handleToggle = () => {
    const willBeRunning = !timerState.isRunning;

    if (!willBeRunning) {
      // Stopping the timer: save the delta since the last update
      if (lastUpdateTimeRef.current > 0) {
        const elapsed = Date.now() - lastUpdateTimeRef.current;
        if (elapsed > 0) {
          updateTaskTimeSpent(taskId, elapsed);
          // Update display immediately
          displayTimeRef.current += elapsed;
          forceUpdate();
        }
      }
      // Reset ref time as it's stopping
      lastUpdateTimeRef.current = 0;
    }
    // If starting, the useEffect hook handles setting lastUpdateTimeRef

    toggleTaskTimer(taskId, willBeRunning);
  };

  // --- Render ---
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-2', className)}>
            <div className="flex h-6 items-center justify-center rounded-md bg-gray-800/80 px-2 py-1 text-xs font-medium tabular-nums text-white">
              {formatTime(displayTimeRef.current)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggle();
              }}
              aria-label={timerState.isRunning ? 'Pause timer' : 'Start timer'}
            >
              {timerState.isRunning ? (
                <Pause className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Play className="h-3 w-3" aria-hidden="true" />
              )}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-0.5 text-[10px] uppercase">
          time spent on task
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
