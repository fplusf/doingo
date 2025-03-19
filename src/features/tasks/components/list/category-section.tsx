import { TIMELINE_CATEGORIES } from '@/features/tasks/components/timeline/timeline';
import { PRIORITY_COLORS as PRIORITY_COLOR_HEX } from '@/features/tasks/constants/priority-colors';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { addMilliseconds, differenceInMilliseconds } from 'date-fns';
import { Clock, Coffee, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CategorySectionProps, ONE_HOUR_IN_MS, OptimalTask } from '../../types';
import { SortableTimelineTaskItem } from './sortable-timeline-task-item';

// Define 15 minutes in milliseconds
const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;

interface ConnectorSegment {
  top: string;
  height: string;
  startColor: string;
  endColor: string;
  left: string;
  isDotted?: boolean;
  timeGap?: number;
  remainingDuration?: number;
  hasFreeSlot?: boolean;
  hasSmallGap?: boolean;
  hasLargeGap?: boolean;
  startTime?: Date;
  endTime?: Date;
  isPastGap?: boolean;
  isCurrentGap?: boolean;
  isFutureGap?: boolean;
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

    const updateConnectorSegments = () => {
      const container = containerRef.current;
      if (!container) return;

      // Find all timeline nodes within the container
      const timelineNodes = container.querySelectorAll('.timeline-node');
      if (timelineNodes.length === 0) {
        setConnectorSegments([]);
        return;
      }

      // Don't create connector segments if there's only a single node
      if (timelineNodes.length === 1) {
        setConnectorSegments([]);
        return;
      }

      // Get positions relative to the container
      const containerRect = container.getBoundingClientRect();

      // Calculate segments between each pair of nodes
      const segments: ConnectorSegment[] = [];

      // Only if we have at least one node - add segment before first node
      if (timelineNodes.length > 0) {
        const firstNode = timelineNodes[0];
        const firstRect = firstNode.getBoundingClientRect();
        const firstTask = tasks[0];

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

      // Add segments between nodes
      for (let i = 0; i < timelineNodes.length - 1; i++) {
        const currentNode = timelineNodes[i];
        const nextNode = timelineNodes[i + 1];

        const currentRect = currentNode.getBoundingClientRect();
        const nextRect = nextNode.getBoundingClientRect();

        const currentTask = tasks[i];
        const nextTask = tasks[i + 1];

        // Skip if either task is missing
        if (!currentTask || !nextTask) continue;

        // Calculate time gap between tasks using date-fns
        const currentTaskEnd =
          currentTask.startTime && currentTask.duration
            ? addMilliseconds(currentTask.startTime, currentTask.duration)
            : currentTask.startTime;

        const now = new Date();

        // Check if tasks are from a past date by comparing full dates, not just components
        const isCurrentTaskInPast = currentTaskEnd && currentTaskEnd < now;
        const isNextTaskInPast = nextTask.startTime && nextTask.startTime < now;
        const isNextTaskInFuture = nextTask.startTime && nextTask.startTime > now;

        // Calculate gap duration - original full duration between tasks
        const fullGapDuration =
          currentTaskEnd && nextTask.startTime
            ? differenceInMilliseconds(nextTask.startTime, currentTaskEnd)
            : 0;

        // Calculate remaining duration from now to next task start
        const remainingDuration =
          nextTask.startTime && nextTask.startTime > now
            ? differenceInMilliseconds(nextTask.startTime, now)
            : 0;

        // Determine gap type based on task positions relative to current time
        const isPastGap = isCurrentTaskInPast && isNextTaskInPast;
        const isCurrentGap = isCurrentTaskInPast && isNextTaskInFuture;
        const isFutureGap = !isCurrentTaskInPast && !isPastGap;

        // Determine gap size categories
        const hasLargeGap = fullGapDuration > ONE_HOUR_IN_MS && fullGapDuration > 0;
        const hasFreeSlot = fullGapDuration >= FIFTEEN_MINUTES_IN_MS && fullGapDuration > 0;
        const hasSmallGap = fullGapDuration > 0 && fullGapDuration < FIFTEEN_MINUTES_IN_MS;
        const hasOverlap = fullGapDuration < 0;

        // Calculate the bottom edge of current node and top edge of next node
        const currentBottom = currentRect.bottom - containerRect.top;
        const nextTop = nextRect.top - containerRect.top;

        // For consistent positioning of the connector line
        const centerX = currentRect.left + currentRect.width / 2 - containerRect.left;

        // Calculate segment height based on gap
        const baseHeight = nextTop - currentBottom;
        // Make connectors taller with different multipliers based on gap size
        const segmentHeight =
          hasLargeGap && !hasOverlap
            ? baseHeight * 3 // Triple height for large gaps (>1h)
            : hasFreeSlot && !hasOverlap
              ? baseHeight * 1.5 // 1.5x height for free slots (≥15m)
              : baseHeight; // Default height for small gaps and overlaps

        segments.push({
          top: `${currentBottom}px`,
          height: `${segmentHeight}px`,
          startColor: getTaskColor(currentTask),
          endColor: getTaskColor(nextTask),
          left: `${centerX}px`,
          isDotted: hasLargeGap && !hasOverlap,
          timeGap: fullGapDuration > 0 ? fullGapDuration : undefined,
          remainingDuration: remainingDuration > 0 ? remainingDuration : undefined,
          hasFreeSlot: hasFreeSlot && !hasOverlap,
          hasSmallGap: hasSmallGap && !hasOverlap,
          hasLargeGap: hasLargeGap && !hasOverlap,
          startTime: currentTaskEnd,
          endTime: nextTask.startTime,
          isPastGap: isPastGap,
          isCurrentGap: isCurrentGap,
          isFutureGap: isFutureGap,
        });
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
  }, [tasks, category]);

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
                'absolute w-[2px] -translate-x-1/2 transition-all duration-300 ease-in-out',
              )}
              style={{
                top: segment.top,
                height: segment.height,
                left: segment.left,
                background: 'transparent',
                ...(segment.isDotted
                  ? {}
                  : {
                      background: `linear-gradient(to bottom, ${segment.startColor}, ${segment.endColor})`,
                    }),
                opacity: 0.85,
                zIndex: 0,
              }}
            >
              {/* For dotted lines, create individual dots with gradient color interpolation */}
              {segment.isDotted && (
                <>
                  {Array.from({ length: 20 }).map((_, i) => {
                    // Calculate position percentage (0 to 1)
                    const position = i / 19;
                    // Interpolate between the two colors based on position
                    const color = interpolateColor(segment.startColor, segment.endColor, position);

                    return (
                      <div
                        key={i}
                        className="absolute left-0 w-full rounded-full"
                        style={{
                          backgroundColor: color,
                          height: '3px',
                          width: '2px',
                          top: `calc(${position * 100}% - 1.5px)`,
                          opacity: 0.85,
                        }}
                      />
                    );
                  })}
                </>
              )}
            </div>

            {/* "Free slot" or "Get ready" label */}
            {segment.timeGap && segment.timeGap > 0 && (
              <div
                className="absolute left-20 flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-400"
                style={{
                  top:
                    segment.isPastGap && !segment.hasLargeGap
                      ? `calc(${segment.top} + 0px)`
                      : `calc(${segment.top} + ${segment.height} / 2 - ${segment.hasLargeGap ? '80px' : '12px'})`,
                  transform: 'translateY(-50%)',
                  zIndex: 5,
                }}
              >
                {segment.isPastGap ? (
                  <>
                    <Coffee className="h-3.5 w-3.5" />
                    Break
                  </>
                ) : segment.isCurrentGap ? (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    Free slot - {formatDuration(segment.remainingDuration || 0)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-5 w-5 p-0 text-gray-400 hover:bg-transparent hover:text-gray-600"
                      onClick={() =>
                        segment.startTime ? onAddTask(segment.startTime) : onAddTask()
                      }
                      aria-label="Add task in free slot"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : segment.hasFreeSlot ? (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    Free slot - {formatDuration(segment.timeGap || 0)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-5 w-5 p-0 text-gray-400 hover:bg-transparent hover:text-gray-600"
                      onClick={() =>
                        segment.startTime ? onAddTask(segment.startTime) : onAddTask()
                      }
                      aria-label="Add task in free slot"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : segment.hasSmallGap ? (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    Get ready for the next task!
                  </>
                ) : null}
              </div>
            )}
          </div>
        ))}

        {/* Task Cards with Timeline Items */}
        <div className="flex flex-col">
          {tasks.map((task, index) => {
            const isFirst = index === 0;
            const isLast = index === tasks.length - 1;

            // Calculate gap with PREVIOUS task instead of next task
            const prevTask = index > 0 ? tasks[index - 1] : undefined;

            // For the current task, check if there's a large gap with the previous task
            let hasLargeGapWithPrevious = false;
            let hasFreeSlotWithPrevious = false;

            if (prevTask && prevTask.startTime && task.startTime) {
              const prevTaskEnd =
                prevTask.startTime && prevTask.duration
                  ? addMilliseconds(prevTask.startTime, prevTask.duration)
                  : prevTask.startTime;

              const timeGapWithPrevious = prevTaskEnd
                ? differenceInMilliseconds(task.startTime, prevTaskEnd)
                : 0;

              hasLargeGapWithPrevious =
                timeGapWithPrevious > ONE_HOUR_IN_MS && timeGapWithPrevious >= 0;
              hasFreeSlotWithPrevious =
                timeGapWithPrevious >= FIFTEEN_MINUTES_IN_MS && timeGapWithPrevious >= 0;
            }

            // For connector segments, still calculate gap with next task (this is correct)
            const nextTask = !isLast ? tasks[index + 1] : undefined;
            const currentTaskEnd =
              task.startTime && task.duration
                ? addMilliseconds(task.startTime, task.duration)
                : task.startTime;

            const timeGapWithNext =
              currentTaskEnd && nextTask?.startTime
                ? differenceInMilliseconds(nextTask.startTime, currentTaskEnd)
                : 0;

            const hasLargeGapWithNext = timeGapWithNext > ONE_HOUR_IN_MS && timeGapWithNext >= 0;

            return (
              <div
                key={task.id}
                className={cn(
                  'rounded-3xl transition-colors duration-300',
                  highlightedTaskId === task.id && 'bg-muted ring-2 ring-border/50',
                  // Base spacing between items
                  'mt-5',
                  // Increase spacing based on gap size with PREVIOUS task
                  hasLargeGapWithPrevious && 'mt-20', // Triple spacing for large gaps (>1h)
                  !hasLargeGapWithPrevious && hasFreeSlotWithPrevious && 'mt-10', // Double spacing for free slots (≥15m)
                )}
                style={{
                  // Add margin to the first item to match the timeline start
                  ...(isFirst && { marginTop: '24px' }),
                }}
              >
                <SortableTimelineTaskItem
                  task={task}
                  onEdit={onEditTask}
                  isLastItem={isLast}
                  nextTask={!isLast ? tasks[index + 1] : undefined}
                  overlapsWithNext={overlaps.get(task.id) || false}
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

// Function to interpolate between two hex colors
function interpolateColor(colorA: string, colorB: string, amount: number): string {
  const ah = parseInt(colorA.replace(/#/g, ''), 16);
  const ar = ah >> 16;
  const ag = (ah >> 8) & 0xff;
  const ab = ah & 0xff;

  const bh = parseInt(colorB.replace(/#/g, ''), 16);
  const br = bh >> 16;
  const bg = (bh >> 8) & 0xff;
  const bb = bh & 0xff;

  const rr = ar + amount * (br - ar);
  const rg = ag + amount * (bg - ag);
  const rb = ab + amount * (bb - ab);

  return `#${((1 << 24) + (Math.round(rr) << 16) + (Math.round(rg) << 8) + Math.round(rb))
    .toString(16)
    .slice(1)}`;
}
