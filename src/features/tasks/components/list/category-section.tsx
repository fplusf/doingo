import { CategoryBadge } from '@/features/tasks/components/timeline/category-badge';
import { TIMELINE_CATEGORIES } from '@/features/tasks/components/timeline/timeline';
import { PRIORITY_COLORS as PRIORITY_COLOR_HEX } from '@/features/tasks/constants/priority-colors';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CategorySectionProps, OptimalTask } from '../../types';
import { SortableTimelineTaskItem } from './sortable-timeline-task-item';

interface ConnectorSegment {
  top: string;
  height: string;
  startColor: string;
  endColor: string;
  left: string;
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
  const getTaskColor = (task: OptimalTask): string => {
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

        // Calculate the bottom edge of current node and top edge of next node
        const currentBottom = currentRect.bottom - containerRect.top;
        const nextTop = nextRect.top - containerRect.top;

        // For consistent positioning of the connector line
        const centerX = currentRect.left + currentRect.width / 2 - containerRect.left;

        segments.push({
          top: `${currentBottom}px`,
          height: `${nextTop - currentBottom}px`,
          startColor: getTaskColor(currentTask),
          endColor: getTaskColor(nextTask),
          left: `${centerX}px`,
        });
      }

      // Remove the segment after the last node (we don't want a hanging line)
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
          <div
            key={index}
            className="absolute w-[3px] -translate-x-1/2 transition-all duration-300 ease-in-out"
            style={{
              top: segment.top,
              height: segment.height,
              left: segment.left,
              background: `linear-gradient(to bottom, ${segment.startColor}, ${segment.endColor})`,
              opacity: 0.9,
              zIndex: 0,
            }}
          />
        ))}

        {/* Task Cards with Timeline Items */}
        <div className="flex flex-col gap-y-5 space-y-0">
          {tasks.map((task, index) => {
            const isFirst = index === 0;
            const isLast = index === tasks.length - 1;

            return (
              <div
                key={task.id}
                className={cn(
                  'rounded-3xl transition-colors duration-300',
                  highlightedTaskId === task.id && 'bg-muted ring-2 ring-border/50',
                )}
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
