import { OptimalTask } from '../../types';
import { TimelineItem } from '../timeline/timeline';
import { TaskItem } from './task-item';

// Constants - Copied from SortableTimelineTaskItem
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const MIN_HEIGHT_PX = 58;

interface TimelineTaskItemOverlayProps {
  task: OptimalTask;
}

/**
 * A purely visual representation of a task item for the drag overlay.
 * It mirrors the structure and appearance of SortableTimelineTaskItem
 * but without any dnd-kit hooks, interactions, or internal state.
 */
export const TimelineTaskItemOverlay = ({ task }: TimelineTaskItemOverlayProps) => {
  const effectiveDuration = task.duration;

  // Calculate the height based on the task's duration
  const calculatedHeight = MIN_HEIGHT_PX + (effectiveDuration || FIVE_MINUTES_MS) / (60 * 1000);

  // Create a style object with calculated height
  const containerStyle = {
    height: `${calculatedHeight}px`,
    position: 'relative' as const,
    cursor: 'grabbing' as const,
    overflow: 'visible' as const,
  };

  return (
    <div style={containerStyle} className="relative h-full" data-id={`${task.id}-overlay`}>
      {/* Timeline Node - Positioned absolutely relative to the container */}
      <div className="absolute left-2 top-0 z-10 h-full w-11">
        <TimelineItem
          priority={task.priority}
          startTime={task.startTime}
          nextStartTime={task.nextStartTime}
          completed={task.completed}
          strikethrough={task.completed}
          emoji={task.emoji}
          taskId={task.id}
          duration={effectiveDuration}
          category={task.category}
          onEditTask={() => {}}
          onCompletedChange={() => {}}
          onPriorityChange={() => {}}
          isLastItem={false}
          fixedHeight={true}
          nextTaskPriority={'none'}
        />
      </div>

      {/* Task Card Container - With proper margin to account for timeline node */}
      <div className="ml-20 h-full">
        <div className="h-full">
          <TaskItem
            task={{
              ...task,
              duration: effectiveDuration,
              nextStartTime: task.nextStartTime,
            }}
            onEdit={() => {}}
          />
        </div>
      </div>
    </div>
  );
};
