import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';
import { PRIORITY_BG_CLASSES } from '../../constants/priority-colors';
import { ONE_HOUR_IN_MS, TaskCategory, TaskPriority } from '../../types';
import { TimelineNode } from './timeline-node';

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
  priority?: TaskPriority;
  onPriorityChange?: (priority: TaskPriority) => void;
  isLastItem?: boolean;
  fixedHeight?: boolean;
  emoji?: string;
  onEditTask?: () => void;
  taskId?: string;
  duration?: number; // Add duration prop
}

export const TimelineItem = ({
  startTime,
  nextStartTime,
  completed = false,
  onCompletedChange,
  category = DEFAULT_CATEGORY,
  strikethrough = false,
  isNew = false,
  priority = 'none',
  onPriorityChange,
  isLastItem = false,
  fixedHeight = false,
  emoji = '',
  onEditTask,
  taskId,
  duration = 0, // Default to 0 if not provided
}: TimelineItemProps) => {
  const timeDiffMinutes = React.useMemo(() => {
    return (nextStartTime.getTime() - startTime.getTime()) / (1000 * 60);
  }, [startTime, nextStartTime]);

  const [nodeHeight, setNodeHeight] = useState('0px');
  const contentRef = useRef<HTMLDivElement>(null);

  // Get height based on task duration
  const getHeightFromDuration = () => {
    // 0 to 1 hour: 110px height
    if (duration <= ONE_HOUR_IN_MS) {
      return 'h-[110px]';
    }
    // 1 to 3 hours: 170px height
    else if (duration <= ONE_HOUR_IN_MS * 3) {
      return 'h-[170px]';
    }
    // 3+ hours: 230px height
    else {
      return 'h-[230px]';
    }
  };

  // Use duration-based height if available, otherwise use the old dynamic height
  const durationBasedHeight = duration ? getHeightFromDuration() : null;
  const dynamicHeight = fixedHeight
    ? 'h-[122px] lg:h-[156px]'
    : durationBasedHeight ||
      `h-[${Math.max(122, Math.min(300, timeDiffMinutes * 0.5))}px] lg:h-[${Math.max(
        156,
        Math.min(400, timeDiffMinutes * 0.7),
      )}px]`;

  // Update node height when the content height changes
  useEffect(() => {
    if (contentRef.current) {
      const updateNodeHeight = () => {
        if (duration) {
          // Set explicit height based on duration
          if (duration <= ONE_HOUR_IN_MS) {
            setNodeHeight('110px');
          } else if (duration <= ONE_HOUR_IN_MS * 3) {
            setNodeHeight('170px');
          } else {
            setNodeHeight('230px');
          }
        } else {
          // Use the old calculation if no duration provided
          const contentHeight = contentRef.current?.offsetHeight;
          if (contentHeight) {
            const paddedHeight = Math.max(48, contentHeight - 16); // Minimum height of 48px with 16px padding
            setNodeHeight(`${paddedHeight}px`);
          }
        }
      };

      updateNodeHeight();

      // Add resize observer to update height when window resizes
      const resizeObserver = new ResizeObserver(updateNodeHeight);
      resizeObserver.observe(contentRef.current);

      return () => {
        if (contentRef.current) {
          resizeObserver.unobserve(contentRef.current);
        }
      };
    }
  }, [dynamicHeight, duration]);

  // Handle node click to open task modal
  const handleNodeClick = () => {
    if (onEditTask) {
      // Explicitly call the edit task function
      onEditTask();
      console.log('Opening edit dialog for task:', taskId);
    }
  };

  // Handle priority change
  const handlePriorityChange = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (onPriorityChange) {
      const priorities: TaskPriority[] = ['none', 'low', 'medium', 'high'];
      const currentIndex = priorities.indexOf(priority);
      const nextIndex = (currentIndex + 1) % priorities.length;
      onPriorityChange(priorities[nextIndex]);
    }
  };

  return (
    <div
      ref={contentRef}
      className={cn('group relative flex w-full', dynamicHeight)}
      onClick={handleNodeClick} // Add click handler to the entire row
    >
      {/* Add connector extension that goes beyond the current item for visual continuity */}
      {!isLastItem && (
        <div
          className={cn(
            'absolute -bottom-[20px] left-5 z-[5] h-[20px] w-[3px]',
            PRIORITY_BG_CLASSES[priority],
          )}
        />
      )}

      {/* Timeline node with emoji */}
      <div
        className="absolute left-0 top-0 z-10 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          handleNodeClick();
        }}
      >
        <TimelineNode
          completed={completed}
          emoji={emoji}
          priority={priority}
          height={nodeHeight}
          onClick={handleNodeClick}
        />
      </div>
    </div>
  );
};
