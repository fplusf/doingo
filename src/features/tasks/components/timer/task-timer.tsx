import { updateTaskTimeSpent } from '@/features/tasks/store/tasks.store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { useEffect, useState } from 'react';

interface TaskTimerProps {
  taskId: string;
  startTime: Date;
  duration: number;
  initialTimeSpent: number;
}

export function TaskTimer({ taskId, startTime, duration, initialTimeSpent }: TaskTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(initialTimeSpent);

  useEffect(() => {
    let lastUpdate = Date.now();
    const startTime = Date.now() - initialTimeSpent;

    const timer = setInterval(() => {
      const now = Date.now();
      const newElapsedTime = now - startTime;
      setElapsedTime(newElapsedTime);

      // Update task time spent in store every minute
      if (now - lastUpdate >= 60000) {
        updateTaskTimeSpent(taskId, now - lastUpdate);
        lastUpdate = now;
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [taskId, initialTimeSpent]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute right-3 top-2 z-10 flex h-6 w-[72px] cursor-default items-center justify-center rounded-md bg-gray-800/80 px-2 py-1 text-xs font-medium tabular-nums text-white">
            {formatTime(elapsedTime)}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          <p className="text-[10px] uppercase">actual time spent</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
