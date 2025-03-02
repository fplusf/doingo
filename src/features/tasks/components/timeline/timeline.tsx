import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import React from 'react';
import { TaskCategory, TaskPriority } from '../../types';
import { Connector } from './connector';
import completeTaskSound from '/public/complete-task.mp3';

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
}: TimelineItemProps) => {
  const timeDiffMinutes = React.useMemo(() => {
    return (nextStartTime.getTime() - startTime.getTime()) / (1000 * 60);
  }, [startTime, nextStartTime]);

  const isLargeTask = React.useMemo(() => {
    const timeDiffHours = timeDiffMinutes / 60;
    return timeDiffHours > 2;
  }, [timeDiffMinutes]);

  const [progress, setProgress] = React.useState(completed ? 100 : 0);

  React.useEffect(() => {
    setProgress(completed ? 100 : 0);
  }, [completed]);

  const handleCompletedChange = (checked: boolean) => {
    if (onCompletedChange) {
      onCompletedChange(checked);
      if (checked) {
        const audio = new Audio(completeTaskSound);
        audio.play().catch(console.error);
      }
    }
  };

  return (
    <div
      className={cn(
        'relative flex w-full',
        isLargeTask ? 'h-[210px] lg:h-[240px]' : 'h-[122px] lg:h-[156px]',
      )}
    >
      {/* Timeline connector line */}
      {!isLastItem && (
        <div
          className={cn(
            'absolute left-5',
            isLargeTask ? 'top-[40px] h-[calc(100%-36px)]' : 'top-[32px] h-[calc(100%-20px)]',
          )}
        >
          <Connector progress={progress} />
        </div>
      )}

      {/* Checkbox */}
      <div className={cn('absolute left-2 z-10', isLargeTask ? 'top-[33px]' : 'top-[30px]')}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCompletedChange(!completed);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              handleCompletedChange(!completed);
            }
          }}
          className={cn(
            'flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-600 outline-none ring-0 transition-colors hover:border-green-500 focus:outline-none focus:ring-green-500',
            completed ? 'border-green-500 bg-green-500' : 'bg-background',
          )}
          role="checkbox"
          aria-checked={completed}
          aria-label="Toggle task completion"
          tabIndex={0}
        >
          <Check
            className={cn(
              'h-4 w-4',
              completed ? 'text-white opacity-100' : 'text-gray-400 opacity-50',
            )}
          />
        </button>
      </div>
    </div>
  );
};
