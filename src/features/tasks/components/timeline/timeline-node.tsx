import { cn } from '@/lib/utils';
import { addMilliseconds, format } from 'date-fns';
import React from 'react';
import { PRIORITY_BG_CLASSES } from '../../constants/priority-colors';
import { TaskPriority } from '../../types';

interface TimelineNodeProps {
  emoji: string;
  priority?: TaskPriority;
  className?: string;
  completed?: boolean;
  height?: string;
  onClick?: () => void;
  startTime?: Date;
  duration?: number;
}

export function TimelineNode({
  emoji,
  priority = 'none',
  className,
  completed = false,
  height,
  onClick,
  startTime,
  duration,
}: TimelineNodeProps) {
  // Handle click with event prevention
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  // Calculate end time
  const endTime = startTime && duration ? addMilliseconds(startTime, duration) : undefined;

  // Dynamic text shadow configuration based on priority
  const getEmojiTextShadow = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        // For red/high priority (darker background)
        return '0px 1px 2px rgba(0, 0, 0, 0.15), 0px 0px 1px rgba(255, 255, 255, 0.9)';
      case 'medium':
        // For orange/medium priority (medium background)
        return '0px 1px 2px rgba(0, 0, 0, 0.15), 0px 0px 4px rgba(55, 55, 55, 0.7)';
      case 'low':
        // For yellow/low priority (light background)
        return '0px 1px 2px rgba(0, 0, 0, 0.35), 0px 0px 1px rgba(255, 255, 255, 0.6)';
      default:
        // For default/none priority
        return '0px 1px 2px rgba(0, 0, 0, 0.2), 0px 0px 3px rgba(255, 255, 255, 0.9)';
    }
  };

  return (
    <div className="relative">
      {/* Time labels */}
      {startTime && (
        <div className="absolute -left-16 top-0 text-xs text-gray-400">
          {format(startTime, 'h:mm a')}
        </div>
      )}
      {endTime && (
        <div className="absolute -left-16 bottom-0 text-xs text-gray-400">
          {format(endTime, 'h:mm a')}
        </div>
      )}

      {/* Node */}
      <div
        className={cn(
          'relative flex items-center justify-center',
          'w-11 rounded-3xl px-2',
          PRIORITY_BG_CLASSES[priority],
          'cursor-pointer',
          className,
        )}
        style={{
          height: height || '48px',
          minHeight: '48px',
        }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Open task details"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        <div className="flex h-full w-full select-none items-center justify-center py-2">
          {emoji ? (
            <div className="flex h-6 w-6 items-center justify-center">
              <span
                className="text-xl"
                style={{
                  textShadow: getEmojiTextShadow(priority),
                  filter: 'saturate(1.2) contrast(1.1)',
                }}
              >
                {emoji}
              </span>
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-gray-500/20" />
          )}
        </div>
      </div>
    </div>
  );
}
