import { cn } from '@/lib/utils';
import { addMilliseconds, format } from 'date-fns';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PRIORITY_COLORS } from '../../constants/priority-colors';
import { ONE_HOUR_IN_MS, TaskPriority } from '../../types';

interface TimelineNodeProps {
  emoji: string;
  priority?: TaskPriority;
  className?: string;
  completed?: boolean;
  height?: string;
  onClick?: () => void;
  startTime?: Date;
  duration?: number;
  prevTaskEndTime?: Date; // Previous task's end time
  nextTaskStartTime?: Date; // Next task's start time
  hideStartTime?: boolean; // Flag to hide start time (when it matches previous task's end time)
  hideEndTime?: boolean; // Flag to hide end time (when it matches next task's start time)
  isFocused?: boolean;
  timeSpent?: number;
  isEarliestFocused?: boolean; // New prop to determine if this is the earliest focused task
  isTimeFixed?: boolean; // Add this prop for time-fixed tasks
  onCompletedChange?: (completed: boolean) => void; // Add this prop for task completion
  isDetailsView?: boolean; // Flag for details page view
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
  nextTaskStartTime,
  hideStartTime = false,
  hideEndTime = false,
  isFocused = false,
  timeSpent = 0,
  isEarliestFocused = false, // Default to false
  onCompletedChange,
  isDetailsView = false,
}: TimelineNodeProps) {
  const [progress, setProgress] = useState(0);
  const [timeStatus, setTimeStatus] = useState<'past' | 'present' | 'future'>('future');
  const [currentTime, setCurrentTime] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click with event prevention
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  // Handle completion change
  const handleCompletedChange = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCompletedChange) {
      onCompletedChange(!completed);
    }
  };

  // Calculate end time
  const endTime = startTime && duration ? addMilliseconds(startTime, duration) : undefined;

  // Check if times should be merged
  const shouldMergeTimes =
    endTime && nextTaskStartTime && endTime.getTime() === nextTaskStartTime.getTime();

  // Get priority color
  const getPriorityColor = (): string => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS];
  };

  // Memoize the priority color to avoid recalculations
  const priorityColor = useMemo(() => getPriorityColor(), [priority]);

  // Update time status and progress
  useEffect(() => {
    const updateTimeStatus = () => {
      const currentTime = new Date();

      // Special handling for details view
      if (isDetailsView) {
        if (completed) {
          setTimeStatus('past');
          setProgress(100);
          return;
        }

        // If no valid time info, show 50% progress
        if (!startTime || !duration) {
          setTimeStatus('present');
          setProgress(50);
          return;
        }

        const endTimeValue = addMilliseconds(startTime, duration);

        if (endTimeValue < currentTime) {
          // Past task
          setTimeStatus('past');
          setProgress(100);
        } else if (startTime <= currentTime && endTimeValue > currentTime) {
          // Current task
          setTimeStatus('present');
          const elapsedTime = currentTime.getTime() - startTime.getTime();
          const progressPercentage = (elapsedTime / duration) * 100;
          setProgress(Math.min(Math.max(progressPercentage, 0), 100));
        } else {
          // Future task - in details view, still show some progress (25%)
          setTimeStatus('present');
          setProgress(25);
        }
        return;
      }

      // Standard timeline behavior
      if (!startTime || !duration) {
        setTimeStatus('future');
        setProgress(0);
        return;
      }

      const endTimeValue = addMilliseconds(startTime, duration);

      if (endTimeValue < currentTime) {
        setTimeStatus('past');
        setProgress(100);
      } else if (startTime <= currentTime && endTimeValue > currentTime) {
        setTimeStatus('present');
        const elapsedTime = currentTime.getTime() - startTime.getTime();
        const progressPercentage = (elapsedTime / duration) * 100;
        setProgress(Math.min(Math.max(progressPercentage, 0), 100));
      } else {
        setTimeStatus('future');
        setProgress(0);
      }
    };

    updateTimeStatus();
    // Update more frequently for smoother progress
    const intervalId = setInterval(updateTimeStatus, 100);
    return () => clearInterval(intervalId);
  }, [startTime, duration, isDetailsView, completed]);

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    updateTime();

    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const initialTimeout = setTimeout(() => {
      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }, msToNextMinute);

    return () => clearTimeout(initialTimeout);
  }, []);

  // Dynamic text shadow configuration based on priority
  const getEmojiTextShadow = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return '0px 1px 2px rgba(0, 0, 0, 0.15), 0px 0px 1px rgba(255, 255, 255, 0.9)';
      case 'medium':
        return '0px 1px 2px rgba(0, 0, 0, 0.15), 0px 0px 4px rgba(55, 55, 55, 0.7)';
      case 'low':
        return '0px 1px 2px rgba(0, 0, 0, 0.35), 0px 0px 1px rgba(255, 255, 255, 0.6)';
      default:
        return '0px 1px 2px rgba(0, 0, 0, 0.2), 0px 0px 3px rgba(255, 255, 255, 0.9)';
    }
  };

  // Get height based on task duration
  const getNodeHeight = () => {
    if (height) {
      return height;
    }

    if (duration !== undefined) {
      if (duration <= ONE_HOUR_IN_MS) {
        return '60px';
      } else if (duration <= ONE_HOUR_IN_MS * 2) {
        return '120px';
      }
      return '48px';
    }

    return '48px';
  };

  // Get border color based on priority
  const getBorderStyles = (priority: TaskPriority) => {
    if (priority === 'none') {
      return {
        border: '0.5px solid #0a8537',
        boxShadow: '0 0 0 0.5px rgba(102, 187, 106, 0.6)',
      };
    }

    const priorityColor = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS];
    return {
      border: `0.5px solid ${priorityColor}`,
      boxShadow: `0 0 0 0.5px ${priorityColor}90`,
    };
  };

  // Get background color based on time status and priority
  const getBackgroundStyles = () => {
    const defaultBg = {
      backgroundColor: '#323236',
    };

    if (timeStatus === 'past') {
      return {
        backgroundColor: priorityColor,
        opacity: 1,
      };
    }

    if (completed) {
      return {
        // TODO: soften the color without changing opacity
        backgroundColor: priorityColor,
        opacity: 1,
      };
    }

    return defaultBg;
  };

  // Get progress fill style
  const getProgressFillStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: `${progress}%`,
      background: isDetailsView
        ? priorityColor
        : progress === 100
          ? priorityColor
          : `linear-gradient(to bottom, ${priorityColor} 0%, ${priorityColor} 40%, ${priorityColor}80 100%)`,
      transition: 'height 0.2s ease-in-out',
      borderRadius: isDetailsView ? '24px 24px 0 0' : '24px 24px 0 0',
      opacity: isDetailsView ? 0.5 : 1,
    };
  };

  // Get particle styles
  const getParticleStyles = (index: number): React.CSSProperties => {
    const particleSize = 1;
    const horizontalPosition = index * 3 + Math.random() * 2; // More frequent particles
    return {
      position: 'absolute',
      width: `${particleSize}px`,
      height: `${particleSize}px`,
      backgroundColor: 'transparent',
      borderRadius: '50%',
      left: `${horizontalPosition}%`,
      top: `${progress}%`,
      transform: 'translate(-50%, -50%)',
      boxShadow: `
        0 0 1px ${priorityColor},
        0 0 2px ${priorityColor},
        0 0 3px ${priorityColor}
      `,
      filter: 'brightness(1.7)',
      opacity: 0.8,
      animation: `sparkVibrate 0.15s ease-in-out infinite alternate`,
      animationDelay: `${index * 0.02}s`,
      zIndex: 1,
      transition: 'top 0.2s ease-in-out',
    };
  };

  // Determine which time to display based on focus state
  // const displayEndTime = isFocused ? endTime : undefined;
  const displayEndTime = endTime;

  return (
    <div className="relative h-full">
      {/* Render start time conditionally */}
      {startTime && !hideStartTime && (
        <div className="absolute -left-12 top-0 flex items-center text-[10px] font-medium">
          <span className="rounded bg-background/50 px-1 py-0.5 text-foreground/70">
            {format(startTime, 'HH:mm')}
          </span>
        </div>
      )}

      {/* Render current time only for focused tasks */}
      {isFocused && (
        <div className="absolute -left-12 top-1/2 flex -translate-y-1/2 items-center text-[10px] font-medium">
          <span className="rounded bg-blue-500/10 px-1 py-0.5 text-blue-400 ring-1 ring-blue-500/20">
            {format(currentTime, 'HH:mm')}
          </span>
        </div>
      )}

      {/* Render end time */}
      {displayEndTime && !hideEndTime && (
        <div className="absolute -left-12 bottom-0 flex items-center text-[10px] font-medium">
          <span className="rounded bg-background/50 px-1 py-0.5 text-foreground/50">
            {format(displayEndTime, 'HH:mm')}
          </span>
        </div>
      )}

      {/* Render merged time */}
      {/* {shouldMergeTimes && (
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {format(endTime, 'HH:mm')}
        </div>
      )} */}

      <div
        ref={containerRef}
        className={cn(
          'timeline-node relative flex h-full items-center justify-center',
          'w-11 overflow-hidden rounded-3xl px-2',
          'cursor-pointer shadow-sm',
          className,
        )}
        style={{
          transition: 'height 0.2s ease-in-out',
          minHeight: '48px',
          zIndex: 20, // Higher z-index to ensure it's above connector
          position: 'relative' as 'relative', // Fix TypeScript error
          ...getBorderStyles(priority),
          ...getBackgroundStyles(),
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
        {/* Progress fill */}
        {(isDetailsView || (timeStatus === 'present' && !completed && isEarliestFocused)) && (
          <>
            <div style={getProgressFillStyle()} />
            {!isDetailsView &&
              Array.from({ length: 35 }).map((_, index) => (
                <React.Fragment key={index}>
                  <div key={`particle1-${index}`} style={getParticleStyles(index)} />
                  <div key={`particle2-${index}`} style={getParticleStyles(index)} />
                </React.Fragment>
              ))}
          </>
        )}

        {/* Emoji container */}
        <div className="relative z-10 flex h-full w-full select-none items-center justify-center py-2">
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

      {/* Sparkler animation keyframes */}
      <style>{`
        @keyframes sparkVibrate {
          0% {
            transform: translate(-50%, -50%) translateY(-0.5px);
          }
          100% {
            transform: translate(-50%, -50%) translateY(0.5px);
          }
        }
      `}</style>
    </div>
  );
}
