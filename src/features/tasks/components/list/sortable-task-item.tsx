import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import { SortableTaskItemProps } from '../../types';
import { DragHandle } from './drag-handle';

export const SortableTaskItem = ({ task, children }: SortableTaskItemProps) => {
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
    height: '100%',
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="group ml-16 h-full w-full">
      <div className="flex h-full w-full items-center justify-items-center">
        <div className="h-full w-full">{children}</div>
        <div
          {...listeners}
          className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <DragHandle />
        </div>
      </div>
    </div>
  );
};
