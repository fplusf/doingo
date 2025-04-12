import { updateTaskTimeSpent } from '@/features/tasks/store/tasks.store';
import { Button } from '@/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { Pause, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TaskTimerProps {
  taskId: string;
  startTime: Date;
  duration: number;
  initialTimeSpent: number;
}

export function TaskTimer({ taskId, startTime, duration, initialTimeSpent }: TaskTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(initialTimeSpent);
  const [isRunning, setIsRunning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    if (!isRunning) return;

    const startTimeMs = Date.now() - elapsedTime;
    const timer = setInterval(() => {
      const now = Date.now();
      const newElapsedTime = now - startTimeMs;
      setElapsedTime(newElapsedTime);

      // Update task time spent in store every minute
      if (now - lastUpdate >= 60000) {
        updateTaskTimeSpent(taskId, now - lastUpdate);
        setLastUpdate(now);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      // Update time spent when stopping timer
      const now = Date.now();
      if (now - lastUpdate > 0) {
        updateTaskTimeSpent(taskId, now - lastUpdate);
      }
    };
  }, [taskId, isRunning, lastUpdate, elapsedTime]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (isRunning) {
      // Update time spent when pausing
      const now = Date.now();
      if (now - lastUpdate > 0) {
        updateTaskTimeSpent(taskId, now - lastUpdate);
      }
    }
    setLastUpdate(Date.now());
    setIsRunning(!isRunning);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className="flex h-6 items-center justify-center rounded-md bg-gray-800/80 px-2 py-1 text-xs font-medium tabular-nums text-white">
              {formatTime(elapsedTime)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTimer();
              }}
            >
              {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
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
