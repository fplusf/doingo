import { cn } from '@/lib/utils';
import React from 'react';

interface SessionIndicatorProps {
  totalDuration: number;
  currentSession: number;
  className?: string;
  pomodoroDuration: number;
  breakDuration: number;
}

export const SessionIndicator = ({
  totalDuration,
  currentSession,
  className,
  pomodoroDuration,
  breakDuration,
}: SessionIndicatorProps) => {
  // Calculate total number of sessions based on actual pomodoro and break durations
  const totalSessions = Math.ceil(totalDuration / (pomodoroDuration + breakDuration));

  return (
    <div className="flex flex-col gap-1">
      <div className={cn('flex flex-wrap items-center gap-1', className)}>
        {Array.from({ length: totalSessions }).map((_, index) => (
          <React.Fragment key={index}>
            {/* Pomodoro Session */}
            <div
              className={cn(
                'h-1 w-4 rounded-full transition-all duration-200',
                index === currentSession
                  ? 'bg-blue-500'
                  : index < currentSession
                    ? 'bg-blue-500/30'
                    : 'bg-gray-200 dark:bg-gray-700',
              )}
              aria-label={`Pomodoro session ${index + 1} of ${totalSessions}`}
            />

            {/* Break (show between sessions, not after the last one) */}
            {index < totalSessions - 1 && (
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-all duration-200',
                  index === currentSession
                    ? 'bg-green-500'
                    : index < currentSession
                      ? 'bg-green-500/30'
                      : 'bg-gray-200 dark:bg-gray-700',
                )}
                aria-label={`Break after session ${index + 1}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        {currentSession}/{totalSessions} sessions
      </div>
    </div>
  );
};
