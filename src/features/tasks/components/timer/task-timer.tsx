import { updateTaskTimeSpent } from '@/features/tasks/store/tasks.store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { useEffect, useRef, useState } from 'react';

interface TaskTimerProps {
  taskId: string;
  startTime: Date;
  duration: number;
  initialTimeSpent: number;
}

export function TaskTimer({ taskId, startTime, duration, initialTimeSpent }: TaskTimerProps) {
  const [timeSpent, setTimeSpent] = useState(initialTimeSpent);
  const [isRunning, setIsRunning] = useState(true);
  const lastUpdateRef = useRef<number>(Date.now());
  const sessionStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const sessionElapsed = now - sessionStartTimeRef.current;
      const totalTimeSpent = initialTimeSpent + sessionElapsed;
      const remainingTime = duration - totalTimeSpent;

      if (remainingTime <= 0) {
        setIsRunning(false);
        return;
      }

      setTimeSpent(totalTimeSpent);

      // Update the stored time spent every minute
      const timeSinceLastUpdate = now - lastUpdateRef.current;
      if (timeSinceLastUpdate >= 60000) {
        updateTaskTimeSpent(taskId, timeSinceLastUpdate);
        lastUpdateRef.current = now;
      }
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [taskId, duration, initialTimeSpent]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Always show in HH:MM:SS format for consistent width
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute right-3 top-2 z-10 flex h-6 w-[72px] cursor-default items-center justify-center rounded-md bg-gray-800/80 px-2 py-1 text-xs font-medium tabular-nums text-white">
            {formatTime(timeSpent)}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          <p className="text-[10px] uppercase">actual time spent</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
