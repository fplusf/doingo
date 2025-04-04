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
}

// Interface defining the structure of a sand particle
interface SandParticle {
  id: number;
  size: number;
  left: number;
  delay: number;
  duration: number;
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
  prevTaskEndTime,
  nextTaskStartTime,
  hideStartTime = false,
  hideEndTime = false,
}: TimelineNodeProps) {
  const [progress, setProgress] = useState(0);
  const [timeStatus, setTimeStatus] = useState<'past' | 'present' | 'future'>('future');
  const [now, setNow] = useState(new Date());
  const [particles, setParticles] = useState<SandParticle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Check if times should be merged
  const shouldMergeTimes =
    endTime && nextTaskStartTime && endTime.getTime() === nextTaskStartTime.getTime();

  // Get priority color
  const getPriorityColor = (): string => {
    if (priority === 'none' || priority === 'not-urgent-not-important') {
      return '#66BB6A'; // Green for Daily Meditation, Overlapping Task
    }
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS];
  };

  // Memoize the priority color to avoid recalculations
  const priorityColor = useMemo(() => getPriorityColor(), [priority]);

  // Update time status and progress
  useEffect(() => {
    // Initial calculation
    const updateTimeStatus = () => {
      const currentTime = new Date();
      setNow(currentTime);

      if (!startTime || !duration) {
        setTimeStatus('future');
        return;
      }

      const endTimeValue = addMilliseconds(startTime, duration);

      if (endTimeValue < currentTime) {
        // Task is in the past
        setTimeStatus('past');
        setProgress(100);
      } else if (startTime <= currentTime && endTimeValue > currentTime) {
        // Task is ongoing
        setTimeStatus('present');
        const totalDuration = duration;
        const elapsedTime = currentTime.getTime() - startTime.getTime();
        const calculatedProgress = Math.min(Math.max((elapsedTime / totalDuration) * 100, 0), 100);
        setProgress(calculatedProgress);
      } else {
        // Task is in the future
        setTimeStatus('future');
        setProgress(0);
      }
    };

    // Update immediately
    updateTimeStatus();

    // Update every second for ongoing tasks
    const intervalId = setInterval(() => {
      updateTimeStatus();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startTime, duration]);

  // Generate sand particles - do this only once when the component becomes 'present'
  useEffect(() => {
    if (timeStatus === 'present' && particles.length === 0) {
      // Create a fixed number of particles with different properties
      const newParticles = Array.from({ length: 20 }, (_, index) => ({
        id: index,
        size: 2 + Math.random() * 3, // 2-5px
        left: 5 + Math.random() * 90, // Random horizontal position (5-95%)
        delay: Math.random() * 2, // Random delay (0-2s)
        duration: 1 + Math.random() * 2, // Random duration (1-3s)
      }));

      setParticles(newParticles);
    }
  }, [timeStatus, particles.length]);

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

  // Get height based on task duration
  const getNodeHeight = () => {
    if (height) {
      return height; // Use provided height if available
    }

    // If we have duration, calculate based on that
    if (duration !== undefined) {
      // 0 to 1 hour: 60px height
      if (duration <= ONE_HOUR_IN_MS) {
        return '60px';
      }
      // 1 to 2 hours: 120px height (intermediate size)
      else if (duration <= ONE_HOUR_IN_MS * 2) {
        return '120px';
      }
      // Default height for longer tasks
      return '48px';
    }

    // Default fallback
    return '48px';
  };

  const nodeHeight = getNodeHeight();

  // Get border color based on priority
  const getBorderStyles = (priority: TaskPriority) => {
    if (priority === 'none' || priority === 'not-urgent-not-important') {
      // Use green border for none/default priority tasks
      return {
        border: '0.5px solid #66BB6A', // Green for Daily Meditation
        boxShadow: '0 0 0 0.5px rgba(102, 187, 106, 0.6)', // Green with 60% opacity
      };
    }

    const priorityColor = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS];
    return {
      border: `0.5px solid ${priorityColor}`, // Thinner border
      boxShadow: `0 0 0 0.5px ${priorityColor}90`, // Shadow with 56% opacity
    };
  };

  // Get background color based on time status and priority
  const getBackgroundStyles = () => {
    // Default background for future tasks
    const defaultBg = {
      backgroundColor: '#323236', // Softer gray background color
    };

    // Past tasks should be filled with priority color
    if (timeStatus === 'past') {
      return {
        backgroundColor: priorityColor,
      };
    }

    // For ongoing tasks, we'll use the sand effect
    if (timeStatus === 'present' && !completed) {
      return {
        backgroundColor: '#323236', // Softer background for present tasks
        overflow: 'hidden', // Ensure particles don't overflow
      };
    }

    // For future tasks and completed present tasks, use default background
    return defaultBg;
  };

  // Generate sand particle styles with CSS
  const getParticleStyle = (particle: SandParticle): React.CSSProperties => {
    return {
      position: 'absolute',
      width: `${particle.size}px`,
      height: `${particle.size}px`,
      backgroundColor: priorityColor,
      borderRadius: '50%',
      left: `${particle.left}%`,
      top: 0,
      opacity: 0.7 + Math.random() * 0.2, // Higher opacity for particles
      zIndex: 2,
      animation: `fallingSand ${particle.duration}s ease-in infinite ${particle.delay}s`,
      animationPlayState: progress >= 100 ? 'paused' : 'running',
    };
  };

  // Get sand level style based on progress
  const getSandLevelStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: `${progress}%`,
      backgroundColor: priorityColor,
      opacity: 0.7, // Higher opacity for sand level
      borderRadius: '0 0 24px 24px',
      transition: 'height 1s ease-in-out',
      zIndex: 1,
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)', // Slightly stronger shadow
    };
  };

  return (
    <div className="relative">
      {/* Render start time */}
      {startTime && !shouldMergeTimes && (
        <div className="absolute -left-12 top-0 text-xs text-muted-foreground">
          {format(startTime, 'HH:mm')}
        </div>
      )}

      {/* Render end time */}
      {endTime && !shouldMergeTimes && (
        <div className="absolute -left-12 bottom-0 text-xs text-muted-foreground/60">
          {format(endTime, 'HH:mm')}
        </div>
      )}

      {/* Render merged time */}
      {shouldMergeTimes && (
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {format(endTime, 'HH:mm')}
        </div>
      )}

      <div
        ref={containerRef}
        className={cn(
          'timeline-node relative flex items-center justify-center',
          'w-11 overflow-hidden rounded-3xl px-2',
          'cursor-pointer shadow-sm',
          className,
        )}
        style={{
          height: nodeHeight,
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
        {/* Sand level at the bottom */}
        {timeStatus === 'present' && !completed && <div style={getSandLevelStyle()} />}

        {/* Sand particles with CSS animations */}
        {timeStatus === 'present' &&
          !completed &&
          particles.map((particle) => <div key={particle.id} style={getParticleStyle(particle)} />)}

        {/* Emoji container - keep above sand */}
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

      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes fallingSand {
          0% {
            transform: translateY(0);
            opacity: 0.7;
          }
          70% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(${containerRef.current?.clientHeight || 100}px);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
