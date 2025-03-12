import { CategoryBadge } from '@/features/tasks/components/timeline/category-badge';
import { TIMELINE_CATEGORIES } from '@/features/tasks/components/timeline/timeline';
import { PRIORITY_COLORS as PRIORITY_COLOR_HEX } from '@/features/tasks/constants/priority-colors';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { addMilliseconds, differenceInMilliseconds } from 'date-fns';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CategorySectionProps, ONE_HOUR_IN_MS, OptimalTask } from '../../types';
import { SortableTimelineTaskItem } from './sortable-timeline-task-item';

interface ConnectorSegment {
  top: string;
  height: string;
  startColor: string;
  endColor: string;
  left: string;
  isDotted?: boolean;
  timeGap?: number;
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

  // Update connector segments when DOM changes
  useEffect(() => {
    if (tasks.length <= 0 || !containerRef.current) return;

    const updateConnectorSegments = () => {
      const container = containerRef.current;
      if (!container) return;

      // Find all timeline nodes within the container
      const timelineNodes = container.querySelectorAll('.timeline-node');
      if (timelineNodes.length === 0) return;

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

        const timeGap =
          currentTaskEnd && nextTask.startTime
            ? differenceInMilliseconds(nextTask.startTime, currentTaskEnd)
            : 0;

        // Only consider it a large gap if there's no overlap and gap is > 1 hour
        const hasLargeGap = timeGap > ONE_HOUR_IN_MS;
        const hasOverlap = timeGap < 0;

        // Calculate the bottom edge of current node and top edge of next node
        const currentBottom = currentRect.bottom - containerRect.top;
        const nextTop = nextRect.top - containerRect.top;

        // For consistent positioning of the connector line
        const centerX = currentRect.left + currentRect.width / 2 - containerRect.left;

        // Calculate segment height based on gap
        const baseHeight = nextTop - currentBottom;
        // Only increase spacing if there's a large gap and no overlap
        const segmentHeight = hasLargeGap && !hasOverlap ? baseHeight * 2 : baseHeight;

        segments.push({
          top: `${currentBottom}px`,
          height: `${segmentHeight}px`,
          startColor: getTaskColor(currentTask),
          endColor: getTaskColor(nextTask),
          left: `${centerX}px`,
          isDotted: hasLargeGap && !hasOverlap,
          timeGap: hasLargeGap && !hasOverlap ? timeGap : undefined,
        });
      }

      setConnectorSegments(segments);
    };

    // Initial update
    setTimeout(updateConnectorSegments, 50);

    // Set up observer to monitor layout changes
    const resizeObserver = new ResizeObserver(updateConnectorSegments);
    resizeObserver.observe(containerRef.current);

    // Clean up
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [tasks, category]);

  return (
    <div className="relative mb-16 min-h-8" id={`category-${category}`}>
      <CategoryBadge
        category={category}
        label={TIMELINE_CATEGORIES[category].label}
        color={TIMELINE_CATEGORIES[category].color}
        isSticky
      />
      <div className="relative mt-4" ref={containerRef}>
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
                  ? {}
                  : {
                      background: `linear-gradient(to bottom, ${segment.startColor}, ${segment.endColor})`,
                    }),
                opacity: 0.9,
                zIndex: 0,
              }}
            >
              {/* For dotted lines, create individual dots with gradient color interpolation */}
              {segment.isDotted && (
                <>
                  {Array.from({ length: 10 }).map((_, i) => {
                    // Calculate position percentage (0 to 1)
                    const position = i / 9;
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
                          opacity: 0.9,
                        }}
                      />
                    );
                  })}
                </>
              )}
            </div>

            {/* "Free slot" label for gaps > 1 hour */}
            {segment.isDotted && segment.timeGap && (
              <div
                className="absolute left-20 whitespace-nowrap text-xs text-muted-foreground/60"
                style={{
                  top: `calc(${segment.top} + ${segment.height} / 2 - 30px)`,
                  zIndex: 5,
                }}
              >
                Free slot - {formatDuration(segment.timeGap)}
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
                  // Double the spacing ONLY if there's a large gap with the PREVIOUS task
                  hasLargeGapWithPrevious && 'mt-10',
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
            onClick={onAddTask}
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
