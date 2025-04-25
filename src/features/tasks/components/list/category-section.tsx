import { TIMELINE_CATEGORIES } from '@/features/tasks/components/timeline/timeline';
import { PRIORITY_COLORS as PRIORITY_COLOR_HEX } from '@/features/tasks/constants/priority-colors';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { addMilliseconds, differenceInMilliseconds } from 'date-fns';
import { Clock, Coffee, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CategorySectionProps, ONE_HOUR_IN_MS, OptimalTask } from '../../types';

import { DottedConnector } from '../timeline/dotted-connector';
import { TimelineTaskItem } from './timeline-task-item';

// Define 15 minutes in milliseconds
const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;
// Define 20 minutes in milliseconds
const TWENTY_MINUTES_IN_MS = 20 * 60 * 1000;

// 7 hours in milliseconds - for detecting very long gaps
const SEVEN_HOURS_IN_MS = 7 * 60 * 60 * 1000;

interface ConnectorSegment {
  top: string;
  height: string;
  startColor: string;
  endColor: string;
  left: string;
  isDotted?: boolean;
  timeGap?: number;
  remainingDuration?: number;
  startTime?: Date;
  endTime?: Date;
  isForGap?: boolean;
}

export function CategorySection({
  category,
  tasks,
  onAddTask,
  onEditTask,
  overlaps,
  highlightedTaskId,
}: CategorySectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [connectorSegments, setConnectorSegments] = useState<ConnectorSegment[]>([]);
  const nowRef = useRef(new Date()); // Use ref to keep 'now' consistent across renders

  // Find the earliest focused task that is currently in progress
  const earliestFocusedTask = useMemo(() => {
    const now = new Date();
    return tasks
      .filter(
        (task) =>
          task.isFocused &&
          !task.isGap &&
          task.startTime &&
          task.duration &&
          task.startTime <= now &&
          addMilliseconds(task.startTime, task.duration) > now,
      )
      .sort((a, b) =>
        a.startTime && b.startTime ? a.startTime.getTime() - b.startTime.getTime() : 0,
      )[0];
  }, [tasks]);

  // Get color for a task based on its priority
  const getTaskColor = (task?: OptimalTask): string => {
    if (!task) return PRIORITY_COLOR_HEX.none;
    const priority = task.priority || 'none';
    return PRIORITY_COLOR_HEX[priority] || PRIORITY_COLOR_HEX.none;
  };

  // Clear connector segments when component unmounts or tasks change
  useEffect(() => {
    return () => {
      setConnectorSegments([]);
    };
  }, [tasks]);

  // Update connector segments when DOM changes
  useEffect(() => {
    // Explicitly clear connector segments when no tasks
    if (tasks.length <= 0) {
      setConnectorSegments([]);
      return;
    }

    if (!containerRef.current) return;

    // Update 'now' time on each effect run
    nowRef.current = new Date();
    const now = nowRef.current;

    const updateConnectorSegments = () => {
      const container = containerRef.current;
      if (!container) return;

      // Find all timeline nodes within the container
      const timelineNodes = container.querySelectorAll('.timeline-node');

      // Don't create connector segments if there are no nodes or only one node
      if (timelineNodes.length <= 1) {
        setConnectorSegments([]);
        return;
      }

      // Count the number of real tasks (not gaps) - if there's only one, don't add connectors
      const realTaskCount = tasks.filter((task) => !task.isGap).length;
      if (realTaskCount <= 1) {
        setConnectorSegments([]);
        return;
      }

      // Get positions relative to the container
      const containerRect = container.getBoundingClientRect();

      // Calculate segments between each pair of nodes
      const segments: ConnectorSegment[] = [];

      // Find the last non-gap task index for later use
      const lastTaskIndex = [...tasks].reverse().findIndex((task) => !task.isGap);
      const lastRealTaskIndex = lastTaskIndex >= 0 ? tasks.length - 1 - lastTaskIndex : -1;

      // Only if we have at least one real task node - add segment before first node
      // Skip gap items for this initial segment
      if (timelineNodes.length > 0) {
        // Find first non-gap item to get its node
        const firstNodeIndex = tasks.findIndex((task) => !task.isGap);
        if (firstNodeIndex >= 0) {
          const firstNode = timelineNodes[firstNodeIndex];
          const firstRect = firstNode.getBoundingClientRect();
          const firstTask = tasks[firstNodeIndex];

          // Add segment before the first node (using category color)
          const centerX = firstRect.left + firstRect.width / 2 - containerRect.left;
          const categoryColor = TIMELINE_CATEGORIES[category].color;

          segments.push({
            top: '24px', // Start 24px from the top
            height: `${firstRect.top - containerRect.top - 24}px`,
            startColor: categoryColor,
            endColor: getTaskColor(firstTask),
            left: `${centerX}px`,
          });
        }
      }

      // Process all tasks to create connector segments
      for (let i = 0; i < tasks.length - 1; i++) {
        const currentTask = tasks[i];
        const nextTask = tasks[i + 1];

        // Skip if either task is missing
        if (!currentTask || !nextTask) continue;

        // If the current task is the last real task, don't add any more connectors after it
        if (i === lastRealTaskIndex) continue;

        // For gap items, we'll create a special dotted connector
        const isGapItem = currentTask.isGap || nextTask.isGap;

        // Find the corresponding DOM nodes
        // Note: For gap items, we'll need to manually calculate positions
        // since they don't have actual nodes
        const currentNodeIndex = tasks.findIndex((t) => t.id === currentTask.id);
        const nextNodeIndex = tasks.findIndex((t) => t.id === nextTask.id);

        // If either task is missing a DOM node (should not happen), skip
        if (currentNodeIndex < 0 || nextNodeIndex < 0) continue;

        // For non-gap items, get the actual DOM node
        let currentRect: DOMRect | null = null;
        let nextRect: DOMRect | null = null;

        if (!currentTask.isGap) {
          // Count only non-gap nodes to find the correct DOM element
          const realNodeIndex =
            tasks.slice(0, currentNodeIndex + 1).filter((t) => !t.isGap).length - 1;
          if (realNodeIndex >= 0 && realNodeIndex < timelineNodes.length) {
            currentRect = timelineNodes[realNodeIndex].getBoundingClientRect();
          }
        }

        if (!nextTask.isGap) {
          // Count only non-gap nodes to find the correct DOM element
          const realNodeIndex =
            tasks.slice(0, nextNodeIndex + 1).filter((t) => !t.isGap).length - 1;
          if (realNodeIndex >= 0 && realNodeIndex < timelineNodes.length) {
            nextRect = timelineNodes[realNodeIndex].getBoundingClientRect();
          }
        }

        // Special handling for gap items
        if (currentTask.isGap || nextTask.isGap) {
          // Calculate positions for gap connectors
          let currentBottom: number;
          let nextTop: number;
          let centerX: number;

          if (currentTask.isGap) {
            // For a gap item, get the previous non-gap node's bottom position
            const prevNonGapIndex = tasks
              .slice(0, currentNodeIndex)
              .reverse()
              .findIndex((t) => !t.isGap);
            const prevRealNodeIndex =
              prevNonGapIndex >= 0 ? currentNodeIndex - 1 - prevNonGapIndex : -1;

            if (prevRealNodeIndex >= 0) {
              const prevNonGapTask = tasks[prevRealNodeIndex];
              const realPrevNodeIndex =
                tasks.slice(0, prevRealNodeIndex + 1).filter((t) => !t.isGap).length - 1;

              if (realPrevNodeIndex >= 0 && realPrevNodeIndex < timelineNodes.length) {
                const prevRect = timelineNodes[realPrevNodeIndex].getBoundingClientRect();
                currentBottom = prevRect.bottom - containerRect.top;
                centerX = prevRect.left + prevRect.width / 2 - containerRect.left;
              } else {
                // Fallback: Use some reasonable defaults
                currentBottom = 0;
                centerX = 20;
              }
            } else {
              // Fallback: Use some reasonable defaults
              currentBottom = 0;
              centerX = 20;
            }

            // For the next item (if it's not a gap)
            if (nextRect) {
              nextTop = nextRect.top - containerRect.top;
            } else {
              // If next item is also a gap, approximate the position
              // based on gap duration
              const gapHeight = currentTask.duration
                ? Math.min(100, currentTask.duration / 600000)
                : 50;
              nextTop = currentBottom + gapHeight;
            }
          } else {
            // Current task is not a gap, but next task is
            if (currentRect) {
              currentBottom = currentRect.bottom - containerRect.top;
              centerX = currentRect.left + currentRect.width / 2 - containerRect.left;
            } else {
              // Fallback: Use some reasonable defaults
              currentBottom = 0;
              centerX = 20;
            }

            // Approximate the next position for a gap
            const gapHeight = nextTask.duration ? Math.min(100, nextTask.duration / 600000) : 50;
            nextTop = currentBottom + gapHeight;
          }

          // Calculate gap duration for determining if it's a very long gap
          const gapDuration = currentTask.isGap ? currentTask.duration : nextTask.duration || 0;

          // Create a dotted connector segment for the gap
          segments.push({
            top: `${currentBottom}px`,
            height: `${nextTop - currentBottom}px`,
            startColor: getTaskColor(currentTask),
            endColor: getTaskColor(nextTask),
            left: `${centerX}px`,
            isDotted: true,
            timeGap: gapDuration,
            startTime: currentTask.startTime,
            endTime: nextTask.startTime,
            isForGap: true,
          });

          continue;
        }

        // Regular processing for non-gap items
        if (currentRect && nextRect) {
          // Calculate segment parameters for regular tasks
          const currentBottom = currentRect.bottom - containerRect.top;
          const nextTop = nextRect.top - containerRect.top;
          const centerX = currentRect.left + currentRect.width / 2 - containerRect.left;

          // Calculate time gap between tasks
          const currentTaskEnd =
            currentTask.startTime && currentTask.duration
              ? addMilliseconds(currentTask.startTime, currentTask.duration)
              : currentTask.startTime;

          // Calculate gap duration
          const fullGapDuration =
            currentTaskEnd && nextTask.startTime
              ? differenceInMilliseconds(nextTask.startTime, currentTaskEnd)
              : 0;

          // Determine if it should have a dotted line (large gaps)
          const hasLargeGap = fullGapDuration > ONE_HOUR_IN_MS && fullGapDuration > 0;
          const isVeryLongGap = fullGapDuration >= SEVEN_HOURS_IN_MS;

          segments.push({
            top: `${currentBottom}px`,
            height: `${nextTop - currentBottom}px`,
            startColor: getTaskColor(currentTask),
            endColor: getTaskColor(nextTask),
            left: `${centerX}px`,
            isDotted: hasLargeGap,
            timeGap: fullGapDuration > 0 ? fullGapDuration : undefined,
            startTime: currentTaskEnd,
            endTime: nextTask.startTime,
          });
        }
      }

      setConnectorSegments(segments);
    };

    // Initial update with a delay to ensure DOM is ready
    const initialUpdateTimeout = setTimeout(updateConnectorSegments, 50);

    // Set up observer to monitor layout changes
    const resizeObserver = new ResizeObserver(updateConnectorSegments);
    resizeObserver.observe(containerRef.current);

    // Clean up
    return () => {
      clearTimeout(initialUpdateTimeout);
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [tasks, category]); // Rerun effect when tasks or category change

  // Function to render gap content based on gap type
  const renderGapContent = (task: OptimalTask) => {
    if (!task.isGap || !task.gapType) return null;

    const gapType = task.gapType;
    const duration = task.duration || 0;

    switch (gapType) {
      case 'break':
        return (
          <div className="flex items-center gap-1.5">
            <Coffee className="h-3.5 w-3.5" />
            <span>
              Need a break of <em className="font-medium">{formatDuration(duration)}</em>?
            </span>
          </div>
        );
      case 'free-slot':
        return (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Free slot - {formatDuration(duration)}</span>
            {task.gapStartTime && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-5 w-5 p-0 text-gray-400 hover:bg-transparent hover:text-gray-600"
                onClick={() => onAddTask(task.gapStartTime)}
                aria-label="Add task in free slot"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      case 'get-ready':
        return (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Get ready for the next task!</span>
          </div>
        );
      case 'major-strides':
        return (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Major strides in <em className="font-medium">{formatDuration(duration)}</em>?
            </span>
          </div>
        );
      default:
        return <span>{task.title}</span>;
    }
  };

  return (
    <div className="relative mb-16 min-h-8" id={`category-${category}`}>
      {/* Commented out CategoryBadge for single timeline
      <CategoryBadge
        className="mt-4"
        category={category}
        label={TIMELINE_CATEGORIES[category].label}
        color={TIMELINE_CATEGORIES[category].color}
        isSticky
      />
      */}
      <div className="relative" ref={containerRef}>
        {/* Multiple connector segments with gradient transitions */}
        {connectorSegments.map((segment, index) => (
          <div key={index} className="relative">
            {/* Connector line */}
            <div
              className={cn(
                'absolute w-[3px] -translate-x-1/2 transition-all duration-300 ease-in-out',
              )}
              style={{
                top: segment.top,
                height: segment.height,
                left: segment.left,
                background: 'transparent',
                ...(segment.isDotted
                  ? {} // If dotted, background is handled below
                  : {
                      // Solid gradient line
                      background: `linear-gradient(to bottom, ${segment.startColor}, ${segment.endColor})`,
                    }),
                opacity: 0.85,
                zIndex: 0,
              }}
            >
              {/* For dotted lines, use the new DottedConnector component */}
              {segment.isDotted && (
                <DottedConnector
                  startColor={segment.startColor}
                  endColor={segment.endColor}
                  segmentHeight={parseFloat(segment.height)}
                  isLongGap={segment.timeGap ? segment.timeGap >= SEVEN_HOURS_IN_MS : false}
                  timeGap={segment.timeGap}
                />
              )}
            </div>
          </div>
        ))}

        {/* Task Cards with Timeline Items */}
        <div className="flex h-full flex-col">
          {tasks.map((task, index) => {
            const isFirst = index === 0;
            const isLast = index === tasks.length - 1;
            const now = nowRef.current; // Get consistent 'now' time

            // Don't calculate margins for gap items - they will be styled differently
            if (task.isGap) {
              // Render a special gap item instead of a task card
              return (
                <div key={task.id} className="relative mb-2 ml-16 mt-2 flex items-center">
                  {/* Gap content */}
                  <div className="rounded-md bg-gray-800/20 px-3 py-2 text-xs text-gray-400">
                    {renderGapContent(task)}
                  </div>
                </div>
              );
            }

            // Handle regular task items (not gaps)
            const prevTask = index > 0 ? tasks[index - 1] : undefined;

            // Calculate margin, skipping gap items in the calculation
            // We only want margins between real tasks
            const shouldApplyMargin = !task.isGap && (!prevTask || !prevTask.isGap);
            const marginTopClass = shouldApplyMargin ? 'mt-5' : '';

            return (
              <div
                key={task.id}
                className={cn(
                  'h-full rounded-3xl transition-colors duration-300',
                  highlightedTaskId === task.id && 'bg-muted ring-2 ring-border/50',
                  marginTopClass,
                )}
                style={{
                  ...(isFirst && { marginTop: '24px' }),
                }}
              >
                <TimelineTaskItem
                  task={task}
                  onEdit={onEditTask}
                  isLastItem={isLast}
                  nextTask={!isLast ? tasks[index + 1] : undefined}
                  overlapsWithNext={overlaps.get(task.id) || false}
                  isEarliestFocused={task.id === earliestFocusedTask?.id}
                />
              </div>
            );
          })}

          <Button
            onClick={() => onAddTask()}
            variant="ghost"
            className="z-30 my-10 ml-16 w-[calc(100%-4rem)] justify-start gap-2 bg-transparent text-muted-foreground hover:bg-transparent"
          >
            <Plus className="h-4 w-4" />
            Add new task
          </Button>
        </div>
      </div>
    </div>
  );
}

// Format duration in milliseconds to a readable format (e.g., "2h 30m")
function formatDuration(ms: number): string {
  if (ms <= 0) return '0m'; // Handle zero or negative duration

  const totalMinutes = Math.floor(ms / 60000);
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
