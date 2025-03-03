import { toggleTaskCompletion, updateTask } from '@/features/tasks/store/tasks.store';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import { OptimalTask } from '../../types';
import { TimelineItem } from '../timeline/timeline';
import { DragHandle } from './drag-handle';
import { TaskItem } from './task-item';

interface SortableTimelineTaskItemProps {
  task: OptimalTask;
  onEdit: (task: OptimalTask) => void;
  isLastItem?: boolean;
}

export const SortableTimelineTaskItem = ({
  task,
  onEdit,
  isLastItem = false,
}: SortableTimelineTaskItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
    width: '100%',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="group relative mb-0 cursor-grab pb-0 active:cursor-grabbing"
      data-id={task.id}
    >
      {/* Timeline Item */}
      <div className="absolute left-2 -ml-4 w-full" {...listeners}>
        <TimelineItem
          dotColor={task.priority}
          startTime={task.startTime}
          nextStartTime={task.nextStartTime}
          completed={task.completed}
          strikethrough={task.completed}
          onPriorityChange={(priority) => updateTask(task.id, { priority })}
          onCompletedChange={() => toggleTaskCompletion(task.id)}
          isLastItem={isLastItem}
          fixedHeight={false}
          emoji={task.emoji}
          onEditTask={() => onEdit(task)}
          taskId={task.id}
          duration={task.duration}
        />
      </div>

      {/* Task Card */}
      <div className="ml-16 w-full" {...listeners}>
        <TaskItem task={task} onEdit={onEdit} />
      </div>

      {/* Drag Handle (optional) */}
      <div className="absolute right-0 top-1/3 z-10" {...listeners}>
        <DragHandle />
      </div>
    </div>
  );
};
