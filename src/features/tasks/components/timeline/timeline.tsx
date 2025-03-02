import { cn } from '@/lib/utils';
import { TaskCheckbox } from '@/shared/components/task-checkbox';
import React from 'react';
import { TaskCategory, TaskPriority } from '../../types';
import { Connector } from './connector';

export const TIMELINE_CATEGORIES = {
  work: {
    label: 'Work',
    color: '#3b82f6', // blue
  },
  passion: {
    label: 'Passion',
    color: '#f97316', // orange
  },
  play: {
    label: 'Play',
    color: '#10b981', // green
  },
} as const;

const DEFAULT_CATEGORY = 'work';
const DEFAULT_COLOR = '#64748b'; // slate-500

interface TimelineItemProps {
  startTime: Date;
  nextStartTime: Date;
  completed?: boolean;
  onCompletedChange?: (completed: boolean) => void;
  category?: TaskCategory;
  strikethrough?: boolean;
  isNew?: boolean;
  dotColor?: TaskPriority;
  onPriorityChange?: (priority: TaskPriority) => void;
  isLastItem?: boolean;
  fixedHeight?: boolean;
}

export const TimelineItem = ({
  startTime,
  nextStartTime,
  completed = false,
  onCompletedChange,
  category = DEFAULT_CATEGORY,
  strikethrough = false,
  isNew = false,
  dotColor,
  onPriorityChange,
  isLastItem = false,
  fixedHeight = false,
}: TimelineItemProps) => {
  const timeDiffMinutes = React.useMemo(() => {
    return (nextStartTime.getTime() - startTime.getTime()) / (1000 * 60);
  }, [startTime, nextStartTime]);

  const [progress, setProgress] = React.useState(completed ? 100 : 0);

  React.useEffect(() => {
    setProgress(completed ? 100 : 0);
  }, [completed]);

  return (
    <div className={cn('relative flex w-full', 'h-[122px] lg:h-[156px]')}>
      {/* Timeline connector line */}
      {!isLastItem && (
        <div className="absolute left-5 top-[96px] h-full max-h-[110px] lg:max-h-[120px]">
          <Connector progress={progress} />
        </div>
      )}

      {/* Checkbox */}
      <div className="absolute left-2 top-1/2 z-10 -translate-y-1/2">
        <TaskCheckbox
          checked={completed}
          onCheckedChange={onCompletedChange}
          size="lg"
          soundSrc="/complete-task.mp3"
        />
      </div>
    </div>
  );
};
