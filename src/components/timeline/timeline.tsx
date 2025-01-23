import React from 'react';
import { cn } from '@/lib/utils';
import { TaskCategory, TaskPriority } from '@/store/tasks.store';
import { Check } from 'lucide-react';
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

interface CustomTimelineItemProps {
  children: React.ReactNode;
  time: string;
  startTime: Date;
  nextStartTime: Date;
  completed?: boolean;
  onCompletedChange?: (completed: boolean) => void;
  category?: TaskCategory;
  strikethrough?: boolean;
  isNew?: boolean;
  dotColor?: TaskPriority;
  onPriorityChange?: (priority: TaskPriority) => void;
}

interface CustomTimelineProps {
  children: React.ReactNode;
}

export const CustomTimelineItem = ({
  children,
  time,
  startTime,
  nextStartTime,
  completed = false,
  onCompletedChange,
  category = DEFAULT_CATEGORY,
  strikethrough = false,
  isNew = false,
  dotColor,
  onPriorityChange,
}: CustomTimelineItemProps) => {
  const timeDiffMinutes = React.useMemo(() => {
    return (nextStartTime.getTime() - startTime.getTime()) / (1000 * 60);
  }, [startTime, nextStartTime]);

  const lineHeight = React.useMemo(() => {
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
    }
  };

  return (
    <div
      className={cn(
        'relative flex pl-10',
        strikethrough && 'text-gray-500 line-through',
        lineHeight ? 'h-[100px] lg:h-[170px]' : 'h-[80px] lg:h-[130px]',
      )}
    >
      {/* Timeline connector line */}
      <div className="absolute left-5 top-10 h-[calc(100%-16px)]">
        <Connector progress={progress} />
      </div>

      {/* Checkbox */}
      <div className="absolute left-2 top-4 z-10 lg:top-5">
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
          className={`flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-600 transition-colors hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
            completed ? 'border-green-500 bg-green-500' : 'bg-background'
          }`}
          role="checkbox"
          aria-checked={completed}
          aria-label="Toggle task completion"
          tabIndex={0}
        >
          {completed && <Check className="h-4 w-4 text-white" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 pt-3 lg:pt-4">
        <div className="text-sm text-muted-foreground">{time}</div>
        <div className={cn('mt-1', completed && 'opacity-50', strikethrough && 'line-through')}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const CustomTimeline: React.FC<CustomTimelineProps> = ({ children }) => {
  return <div className="relative pl-4">{children}</div>;
};
