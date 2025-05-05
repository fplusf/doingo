import { CountdownDisplay } from '@/shared/components/countdown-display';
import { Button } from '@/shared/components/ui/button';
import { Clock, Coffee, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { OptimalTask } from '../../types';
import { BreakWidget } from '../schedule/break-widget';

export const GapItem: React.FC<{
  task: OptimalTask;
  onAddTask: (startTime?: Date) => void;
  onAddBreak: (
    taskId: string,
    startTime: Date,
    duration: number,
    breakType: 'after' | 'during',
  ) => void;
}> = ({ task, onAddTask, onAddBreak }) => {
  if (!task.isGap) return null;

  const [isHovered, setIsHovered] = useState(false);
  const duration = task.duration || 0;
  const now = new Date().getTime();
  const [currentTime, setCurrentTime] = useState(now);

  // Update current time every second for accurate countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().getTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get time remaining until the gap ends
  const getTimeRemaining = (): number => {
    if (!task.gapEndTime) return 0;
    return Math.max(0, task.gapEndTime.getTime() - currentTime);
  };

  // Calculate adjusted gap duration (taking any break into account)
  const getAdjustedGapDuration = (): number => {
    if (!task.break) return duration;
    return Math.max(0, duration - (task.break.duration || 0));
  };

  // --- Hover Handlers ---
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const timeUntilEnd = getTimeRemaining();
  const hasBreak = task.break !== undefined;
  const hasActiveBreak =
    hasBreak &&
    task.break?.startTime &&
    task.break.startTime.getTime() <= now &&
    task.break.startTime.getTime() + (task.break.duration || 0) > now;
  const adjustedDuration = getAdjustedGapDuration();

  // Render based on gap position type and break status
  const renderGapContent = () => {
    const gapType = task.gapType as 'past' | 'active' | 'future';

    // If this gap has a break
    if (hasBreak) {
      return (
        <div className="flex items-center gap-1.5">
          <Coffee className="h-3.5 w-3.5" />
          <span>
            {hasActiveBreak ? (
              <span className="flex items-center gap-1">
                <span className="font-medium">Break in progress:</span>{' '}
                <CountdownDisplay
                  endTimeMs={(task.break?.startTime?.getTime() || 0) + (task.break?.duration || 0)}
                  showSeconds={false}
                  className="text-xs font-medium"
                />
              </span>
            ) : (
              <span>
                <span className="font-medium">Scheduled break:</span>{' '}
                {formatDuration(task.break?.duration || 0)}
              </span>
            )}
          </span>
          {adjustedDuration > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              (Free time: {formatDuration(adjustedDuration)})
            </span>
          )}
        </div>
      );
    }

    // Render based on gap position type
    switch (gapType) {
      case 'past':
        return (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Idle time - {formatDuration(duration)}</span>
          </div>
        );

      case 'active':
        return (
          <div className="ml-2 flex items-center gap-1.5">
            <span>
              Free time -{' '}
              <CountdownDisplay
                endTimeMs={task.gapEndTime?.getTime()}
                showSeconds={false}
                className="text-xs font-medium"
              />
            </span>
            {task.gapStartTime && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -left-5 ml-2 h-5 w-5 p-0 text-gray-400 hover:bg-transparent hover:text-gray-600"
                  onClick={() => onAddTask(task.gapStartTime)}
                  aria-label="Add task in free time"
                  title="Add task in free time"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <BreakWidget
                  classNames="ml-4 absolute right-10"
                  taskId={task.id}
                  startTime={task.gapStartTime}
                  onAddBreak={onAddBreak}
                  breakType="after"
                  isActive={gapType === 'active'}
                  isParentHovered={isHovered}
                />
              </>
            )}
          </div>
        );

      case 'future':
        return (
          <div className="ml-2 flex items-center gap-1.5">
            <span>Upcoming free time - {formatDuration(duration)}</span>
            {task.gapStartTime && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -left-5 ml-2 h-5 w-5 p-0 text-gray-400 hover:bg-transparent hover:text-gray-600"
                  onClick={() => onAddTask(task.gapStartTime)}
                  aria-label="Add task in free time"
                  title="Add task in free time"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <BreakWidget
                  classNames="ml-4 absolute right-10"
                  taskId={task.id}
                  startTime={task.gapStartTime}
                  onAddBreak={onAddBreak}
                  breakType="after"
                  isActive={gapType === 'future'}
                  isParentHovered={isHovered}
                />
              </>
            )}
          </div>
        );

      default:
        return <span>{task.title}</span>;
    }
  };

  return (
    <div
      className="group relative flex items-center gap-1.5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {renderGapContent()}
    </div>
  );
};

// Format duration in milliseconds to a readable format
function formatDuration(durationMs: number): string {
  if (durationMs <= 0) return '0m';

  const totalMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}
