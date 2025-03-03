import { cn } from '@/lib/utils';
import React from 'react';

export type NodeColor = 'yellow' | 'pink' | 'green' | 'blue' | 'default';

interface TimelineNodeProps {
  emoji: string;
  color?: NodeColor;
  className?: string;
  completed?: boolean;
  height?: string;
  onClick?: () => void;
}

export const colorMap = {
  yellow: 'bg-yellow-400/80',
  pink: 'bg-pink-400/80',
  green: 'bg-green-500/80',
  blue: 'bg-blue-400/80',
  default: 'bg-gray-700/80',
};

export function TimelineNode({
  emoji,
  color = 'default',
  className,
  completed = false,
  height,
  onClick,
}: TimelineNodeProps) {
  // Handle click with event prevention
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        'w-11 rounded-3xl px-2',
        completed ? 'opacity-30' : 'border border-white/20',
        colorMap[color],
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
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-500/30">
            <span className="text-xl">{emoji}</span>
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full bg-gray-500/20" />
        )}
      </div>
    </div>
  );
}
