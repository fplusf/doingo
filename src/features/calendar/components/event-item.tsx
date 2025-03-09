import type React from 'react';

import type { Event } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CheckSquare, Clock, GripVertical } from 'lucide-react';
import { useRef, useState } from 'react';

interface EventItemProps {
  event: Event;
  onClick: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  isDragging: boolean;
  onResize?: (newDuration: number) => void;
}

const colorOptions = {
  blue: {
    bg: 'bg-blue-500/[0.14] hover:bg-blue-500/[0.23]',
    border: 'border-l-[3px] border-blue-500',
    text: 'text-blue-500',
  },
  red: {
    bg: 'bg-red-500/[0.14] hover:bg-red-500/[0.23]',
    border: 'border-l-[3px] border-red-500',
    text: 'text-red-500',
  },
  green: {
    bg: 'bg-green-500/[0.14] hover:bg-green-500/[0.23]',
    border: 'border-l-[3px] border-green-500',
    text: 'text-green-500',
  },
  purple: {
    bg: 'bg-purple-500/[0.14] hover:bg-purple-500/[0.23]',
    border: 'border-l-[3px] border-purple-500',
    text: 'text-purple-500',
  },
  yellow: {
    bg: 'bg-yellow-500/[0.14] hover:bg-yellow-500/[0.23]',
    border: 'border-l-[3px] border-yellow-500',
    text: 'text-yellow-500',
  },
} as const;

type ColorOption = keyof typeof colorOptions;

export default function EventItem({
  event,
  onClick,
  onDragStart,
  isDragging,
  onResize,
}: EventItemProps) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef<number>(0);
  const initialHeight = useRef<number>(0);
  const durationMinutes = (event.end.getTime() - event.start.getTime()) / 60000;
  const heightInPixels = (durationMinutes / 60) * 48; // 48px per hour

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    initialHeight.current = heightInPixels;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const deltaY = e.clientY - resizeStartY.current;
        const newHeight = Math.max(24, initialHeight.current + deltaY); // Minimum 30 minutes
        const newDuration = (newHeight / 48) * 60; // Convert back to minutes
        onResize?.(newDuration);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Get color classes, falling back to blue if color is invalid or undefined
  const getEventColors = () => {
    const color = event.color as ColorOption;
    return colorOptions[color] || colorOptions.blue;
  };

  const colors = getEventColors();

  return (
    <div
      className={cn(
        'absolute left-0.5 right-1 cursor-pointer select-none overflow-hidden rounded-[3px] text-xs transition-all',
        colors.bg,
        colors.border,
        colors.text,
        isDragging && 'scale-[1.02] opacity-50 shadow-lg',
        'group hover:shadow-md',
      )}
      style={{
        top: `${(event.start.getMinutes() / 60) * 48}px`,
        height: `${heightInPixels}px`,
        zIndex: isDragging || isResizing ? 50 : 10,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onDragStart(e);
      }}
    >
      <div className="px-2 py-[2px]">
        <div className="flex items-center justify-between">
          <div className="flex-1 truncate font-medium leading-5">{event.title}</div>
          <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-50" />
        </div>
        <div className="flex items-center gap-1 opacity-75">
          <Clock className="h-3 w-3" />
          <span className="text-[11px] leading-4">
            {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
          </span>
        </div>
        {event.completed && (
          <div className="mt-0.5 flex items-center gap-1 opacity-75">
            <CheckSquare className="h-3 w-3" />
            <span className="text-[11px] leading-4">Completed</span>
          </div>
        )}
      </div>

      {/* Resize handle */}
      {onResize && (
        <div
          role="presentation"
          className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize opacity-0 hover:bg-current group-hover:opacity-25"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
}
