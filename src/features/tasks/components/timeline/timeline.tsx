import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';
import { TaskCategory, TaskPriority } from '../../types';
import { Connector } from './connector';
import { NodeColor, TimelineNode } from './timeline-node';

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

// Map TaskPriority to NodeColor
const priorityToColorMap: Record<TaskPriority, NodeColor> = {
  high: 'yellow',
  medium: 'pink',
  low: 'green',
  none: 'blue',
  '': 'default',
  'not-urgent-not-important': 'default',
};

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
  emoji?: string;
  onEditTask?: () => void;
  taskId?: string;
}

export const TimelineItem = ({
  startTime,
  nextStartTime,
  completed = false,
  onCompletedChange,
  category = DEFAULT_CATEGORY,
  strikethrough = false,
  isNew = false,
  dotColor = 'none',
  onPriorityChange,
  isLastItem = false,
  fixedHeight = false,
  emoji = '',
  onEditTask,
  taskId,
}: TimelineItemProps) => {
  const timeDiffMinutes = React.useMemo(() => {
    return (nextStartTime.getTime() - startTime.getTime()) / (1000 * 60);
  }, [startTime, nextStartTime]);

  const nodeColor = priorityToColorMap[dotColor];
  const [nodeHeight, setNodeHeight] = useState('0px');
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic height based on time difference if not fixed
  const dynamicHeight = fixedHeight
    ? 'h-[122px] lg:h-[156px]'
    : `h-[${Math.max(122, Math.min(300, timeDiffMinutes * 0.5))}px] lg:h-[${Math.max(156, Math.min(400, timeDiffMinutes * 0.7))}px]`;

  // Update node height when the content height changes
  useEffect(() => {
    if (contentRef.current) {
      const updateNodeHeight = () => {
        const contentHeight = contentRef.current?.offsetHeight;
        if (contentHeight) {
          const paddedHeight = Math.max(48, contentHeight - 16); // Minimum height of 48px with 16px padding
          setNodeHeight(`${paddedHeight}px`);
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
  }, [dynamicHeight]);

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
      const currentIndex = priorities.indexOf(dotColor);
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
      {/* Timeline connector line */}
      {!isLastItem && (
        <div className="absolute left-6 top-0 h-full">
          <Connector />
        </div>
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
          emoji={emoji}
          color={nodeColor}
          isActive={completed}
          height={nodeHeight}
          onClick={handleNodeClick}
        />
      </div>

      {/* Priority change button */}
      <div
        className="absolute -right-2 top-0 z-20 cursor-pointer rounded-full bg-gray-800/50 p-1 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-70"
        onClick={handlePriorityChange}
        role="button"
        tabIndex={0}
        aria-label="Change priority"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (onPriorityChange) {
              const priorities: TaskPriority[] = ['none', 'low', 'medium', 'high'];
              const currentIndex = priorities.indexOf(dotColor);
              const nextIndex = (currentIndex + 1) % priorities.length;
              onPriorityChange(priorities[nextIndex]);
            }
          }
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 12H16"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 8V16"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Task content can be added here */}
      <div className="ml-16 w-full cursor-pointer">{/* Task content placeholder */}</div>
    </div>
  );
};
