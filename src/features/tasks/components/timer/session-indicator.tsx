import { cn } from '@/lib/utils';

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
  const totalSessions = Math.ceil(totalDuration / (pomodoroDuration + breakDuration));

  return (
    <div className={cn('flex items-center justify-start gap-2', className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {Array.from({ length: totalSessions }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-2 w-2 rounded-full transition-all duration-200',
              index <= currentSession ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700',
            )}
            aria-label={`Pomodoro session ${index + 1} of ${totalSessions}`}
          />
        ))}
      </div>
      <div title="Current session progress" className="text-[10px] text-muted-foreground">
        {currentSession + 1}/{totalSessions}
      </div>
    </div>
  );
};
