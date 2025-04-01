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
// Define 20 minutes in milliseconds
const TWENTY_MINUTES_IN_MS = 20 * 60 * 1000; // Added constant

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
  isBreakGap?: boolean; // Added flag for break gap
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

        // Check if tasks are from a past date by comparing full dates
        const isCurrentTaskEndInPast = currentTaskEnd && currentTaskEnd < now;
        const isNextTaskStartInPast = nextTask.startTime && nextTask.startTime < now;
        const isNextTaskStartInFuture = nextTask.startTime && nextTask.startTime > now;

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
        const isPastGap = isCurrentTaskEndInPast && isNextTaskStartInPast;
        const isCurrentGap = isCurrentTaskEndInPast && isNextTaskStartInFuture;
        const isFutureGap = !isCurrentTaskEndInPast && !isNextTaskStartInPast; // Simplified future gap logic

        // Determine gap size categories
        const hasLargeGap = fullGapDuration > ONE_HOUR_IN_MS && fullGapDuration > 0;
        const hasFreeSlot = fullGapDuration >= FIFTEEN_MINUTES_IN_MS && fullGapDuration > 0;
        const hasSmallGap = fullGapDuration > 0 && fullGapDuration < FIFTEEN_MINUTES_IN_MS;
        const hasOverlap = fullGapDuration < 0;

        // Determine if it's a "Break" gap (past and > 20 minutes)
        const isBreakGap = isPastGap && fullGapDuration > TWENTY_MINUTES_IN_MS;

        // Calculate the bottom edge of current node and top edge of next node
        const currentBottom = currentRect.bottom - containerRect.top;
        const nextTop = nextRect.top - containerRect.top;

        // For consistent positioning of the connector line
        const centerX = currentRect.left + currentRect.width / 2 - containerRect.left;

        // Calculate segment height based on gap
        const baseHeight = nextTop - currentBottom;
        // Make connectors taller for larger gaps (consider break gaps like large gaps for height)
        const segmentHeight =
          (isBreakGap || (hasLargeGap && !hasOverlap && !isPastGap)) && baseHeight > 0
            ? baseHeight * 1.5 // Increase height for breaks and large future gaps
            : hasFreeSlot && !hasOverlap && !isPastGap && baseHeight > 0
              ? baseHeight * 1.2 // Slightly increase height for free slots
              : baseHeight; // Default height

        segments.push({
          top: `${currentBottom}px`,
          height: `${segmentHeight}px`,
          startColor: getTaskColor(currentTask),
          endColor: getTaskColor(nextTask),
          left: `${centerX}px`,
          // Dotted line for break gaps OR large future gaps
          isDotted: isBreakGap || (hasLargeGap && !hasOverlap && isFutureGap),
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
          isBreakGap: isBreakGap, // Pass break gap flag
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
  }, [tasks, category]); // Rerun effect when tasks or category change

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
                          height: '4px',
                          width: '3px',
                          top: `calc(${position * 100}% - 2px)`,
                          opacity: 0.85,
                        }}
                      />
                    );
                  })}
                </>
              )}
            </div>

            {/* Label for the gap */}
            {segment.timeGap && segment.timeGap > 0 && (
              <div
                className={cn(
                  'absolute left-20 flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-400',
                  'rounded-md px-2 py-1',
                  // Use darker background for past gaps (including breaks)
                  segment.isPastGap ? 'bg-gray-800/40' : 'bg-gray-800/20',
                )}
                style={{
                  // Position slightly above the exact middle of the connector
                  top: `calc(${segment.top} + ${parseFloat(segment.height) / 2}px)`,
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                }}
              >
                {/* Show "Break" specifically for break gaps */}
                {segment.isBreakGap ? ( // Use isBreakGap here
                  <>
                    <Coffee className="h-3.5 w-3.5" />
                    <span>Break</span>
                  </>
                ) : /* Show "Free slot" or "Get ready" for current/future gaps */
                segment.isCurrentGap ? (
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
                ) : segment.isFutureGap && segment.hasFreeSlot ? ( // Ensure it's a future gap for these labels
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
                ) : segment.isFutureGap && segment.hasSmallGap ? ( // Ensure it's a future gap
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
            const now = nowRef.current; // Get consistent 'now' time

            // Calculate gap properties with PREVIOUS task for spacing
            let isBreakGapWithPrevious = false;
            let hasLargeGapWithPrevious = false;
            let hasFreeSlotWithPrevious = false;
            let isPreviousGapInPast = false; // Flag to check if the gap itself is in the past

            const prevTask = index > 0 ? tasks[index - 1] : undefined;
            if (prevTask && prevTask.startTime && task.startTime) {
              const prevTaskEnd = prevTask.duration
                ? addMilliseconds(prevTask.startTime, prevTask.duration)
                : prevTask.startTime;

              const timeGapWithPrevious = prevTaskEnd
                ? differenceInMilliseconds(task.startTime, prevTaskEnd)
                : 0;

              // Check if the gap period is entirely in the past
              const isPrevTaskEndInPast = prevTaskEnd && prevTaskEnd < now;
              const isCurrentTaskStartInPast = task.startTime && task.startTime < now;
              isPreviousGapInPast = isPrevTaskEndInPast && isCurrentTaskStartInPast;

              // Determine gap sizes with previous task
              hasLargeGapWithPrevious =
                timeGapWithPrevious > ONE_HOUR_IN_MS && timeGapWithPrevious >= 0;
              hasFreeSlotWithPrevious =
                timeGapWithPrevious >= FIFTEEN_MINUTES_IN_MS && timeGapWithPrevious >= 0;

              // Check if the gap with previous is a "Break" gap
              isBreakGapWithPrevious =
                isPreviousGapInPast && timeGapWithPrevious > TWENTY_MINUTES_IN_MS;
            }

            // Determine spacing class based on the gap with the previous task
            const marginTopClass = isBreakGapWithPrevious
              ? 'mt-12' // Past break gap > 20min
              : hasLargeGapWithPrevious && !isPreviousGapInPast
                ? 'mt-12' // Future/current large gap > 1hr
                : hasFreeSlotWithPrevious && !hasLargeGapWithPrevious && !isPreviousGapInPast
                  ? 'mt-8' // Future/current free slot >= 15min
                  : 'mt-5'; // Default small gap or overlap

            // For connector segments, still calculate gap with next task (this is correct)
            // (This calculation is done within the useEffect hook above)

            return (
              <div
                key={task.id}
                className={cn(
                  'rounded-3xl transition-colors duration-300',
                  highlightedTaskId === task.id && 'bg-muted ring-2 ring-border/50',
                  // Apply calculated margin top class
                  marginTopClass,
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

// Function to interpolate between two hex colors
function interpolateColor(colorA: string, colorB: string, amount: number): string {
  // Ensure amount is between 0 and 1
  const clampedAmount = Math.max(0, Math.min(1, amount));

  const ah = parseInt(colorA.replace(/#/g, ''), 16);
  const ar = ah >> 16;
  const ag = (ah >> 8) & 0xff;
  const ab = ah & 0xff;

  const bh = parseInt(colorB.replace(/#/g, ''), 16);
  const br = bh >> 16;
  const bg = (bh >> 8) & 0xff;
  const bb = bh & 0xff;

  const rr = ar + clampedAmount * (br - ar);
  const rg = ag + clampedAmount * (bg - ag);
  const rb = ab + clampedAmount * (bb - ab);

  // Ensure components are within [0, 255] and round them
  const r = Math.round(Math.max(0, Math.min(255, rr)));
  const g = Math.round(Math.max(0, Math.min(255, rg)));
  const b = Math.round(Math.max(0, Math.min(255, rb)));

  // Convert back to hex, ensuring 6 digits with padding if necessary
  const hexR = r.toString(16).padStart(2, '0');
  const hexG = g.toString(16).padStart(2, '0');
  const hexB = b.toString(16).padStart(2, '0');

  return `#${hexR}${hexG}${hexB}`;
}
