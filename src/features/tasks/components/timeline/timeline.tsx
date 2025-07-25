import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';
import { useTaskHistory } from '../../hooks/useTaskHistory';
import { tasksStore } from '../../stores/tasks.store';
import { ONE_HOUR_IN_MS, TaskCategory, TaskPriority } from '../../types';
import { TimelineNode } from './timeline-node';

const DEFAULT_CATEGORY = 'work';

interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
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
  duration?: number;
  nextTaskPriority?: TaskPriority;
  isFocused?: boolean;
  timeSpent?: number;
  isEarliestFocused?: boolean;
  isTimeFixed?: boolean;
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
  duration = ONE_HOUR_IN_MS,
  nextTaskPriority = 'none',
  isFocused = false,
  timeSpent = 0,
  isEarliestFocused = false,
  isTimeFixed = false,
  ...rest
}: TimelineItemProps) => {
  const timeDiffMinutes = React.useMemo(() => {
    return (nextStartTime.getTime() - startTime.getTime()) / (1000 * 60);
  }, [startTime, nextStartTime]);

  const [nodeHeight, setNodeHeight] = useState('0px');
  const contentRef = useRef<HTMLDivElement>(null);

  const { addCompleteTaskAction } = useTaskHistory();

  // Get height based on task duration
  const getHeightFromDuration = () => {
    // 0 to 1 hour: 60px height
    if (duration <= ONE_HOUR_IN_MS) {
      return 'h-[60px]';
    }
    // 1 to 2 hours: 120px height (intermediate size)
    else if (duration <= ONE_HOUR_IN_MS * 2) {
      return 'h-[120px]';
    }
    // 2 to 3 hours: 170px height
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
            setNodeHeight('60px');
          } else if (duration <= ONE_HOUR_IN_MS * 2) {
            setNodeHeight('120px');
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
      onEditTask();
    }
  };

  // Add a handler for task completion that includes history tracking
  const handleCompletedChange = (isCompleted: boolean) => {
    // Find the task to get its previous state
    if (taskId) {
      const task = tasksStore.state.tasks.find((t) => t.id === taskId);

      if (task) {
        // Store task's previous state before toggling completion
        const taskBeforeToggle = { ...task };

        // Call the original onCompletedChange callback
        if (onCompletedChange) {
          onCompletedChange(isCompleted);
        }

        // Add to history for undo/redo
        addCompleteTaskAction(taskId, taskBeforeToggle);
      } else {
        // Fallback if task not found
        if (onCompletedChange) {
          onCompletedChange(isCompleted);
        }
      }
    } else {
      // Fallback if no taskId provided
      if (onCompletedChange) {
        onCompletedChange(isCompleted);
      }
    }
  };

  return (
    <div
      ref={contentRef}
      className={cn('group relative flex h-full w-full')}
      onClick={handleNodeClick}
      {...rest}
    >
      {/* Continuous vertical connector line - now handled at the CategorySection level */}
      {/* Keep z-indices consistent: CategorySection line: z-0, TimelineNode: z-10 */}

      {/* Timeline node with emoji */}
      <div
        className="absolute left-0 top-0 z-10 h-full cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          handleNodeClick();
        }}
      >
        <TimelineNode
          completed={completed}
          emoji={emoji}
          priority={priority}
          onClick={handleNodeClick}
          startTime={startTime}
          duration={duration}
          prevTaskEndTime={isLastItem ? undefined : nextStartTime}
          isFocused={isFocused}
          timeSpent={timeSpent}
          isEarliestFocused={isEarliestFocused}
          isTimeFixed={isTimeFixed}
          onCompletedChange={handleCompletedChange}
        />
      </div>
    </div>
  );
};
