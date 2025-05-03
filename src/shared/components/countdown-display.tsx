import { intervalToDuration } from 'date-fns';
import { useEffect, useState } from 'react';

export interface CountdownDisplayProps {
  /** Total initial duration in milliseconds for the countdown */
  initialDurationMs?: number;
  /** Absolute end time in milliseconds (alternative to initialDurationMs for more accurate countdown) */
  endTimeMs?: number;
  /** Whether to display seconds or just round to the nearest minute */
  showSeconds?: boolean;
  /** Whether to actively count down (if false, just displays static time) */
  isActive?: boolean;
  /** Optional callback when the countdown finishes */
  onComplete?: () => void;
  /** Optional prefix text (e.g., "Time left: ") */
  prefix?: string;
  /** Optional suffix text (e.g., " remaining") */
  suffix?: string;
  /** Optional class name for styling */
  className?: string;
  /** Format to display the time (default: "compact") */
  format?: 'compact' | 'verbose'; // compact: "5m 30s", verbose: "5 minutes 30 seconds"
}

export const CountdownDisplay = ({
  initialDurationMs,
  endTimeMs,
  showSeconds = true,
  isActive = true,
  onComplete,
  prefix = '',
  suffix = '',
  className = '',
  format = 'compact',
}: CountdownDisplayProps) => {
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [remainingMs, setRemainingMs] = useState<number>(
    endTimeMs ? Math.max(0, endTimeMs - currentTime) : initialDurationMs || 0,
  );

  // Update current time and recalculate remaining time if countdown is active
  useEffect(() => {
    if (!isActive) return;

    const calculateRemaining = () => {
      if (endTimeMs) {
        const newRemaining = Math.max(0, endTimeMs - Date.now());
        setRemainingMs(newRemaining);
        return newRemaining;
      } else if (initialDurationMs) {
        // If using static initialDurationMs, we don't recalculate it here
        return remainingMs;
      }
      return 0;
    };

    // Initial calculation
    const initial = calculateRemaining();

    // Don't set up interval if already at 0
    if (initial <= 0) {
      if (onComplete) onComplete();
      return;
    }

    // Set up interval for countdown - use different intervals based on showSeconds
    const intervalTime = showSeconds ? 1000 : 60000; // Update every second or minute based on showSeconds

    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
      const newRemaining = calculateRemaining();

      if (newRemaining <= 0 && onComplete) {
        onComplete();
        clearInterval(intervalId);
      }
    }, intervalTime);

    return () => clearInterval(intervalId);
  }, [isActive, endTimeMs, initialDurationMs, onComplete, remainingMs, showSeconds]);

  // When initialDurationMs changes, reset the countdown
  useEffect(() => {
    if (initialDurationMs !== undefined && !endTimeMs) {
      setRemainingMs(initialDurationMs);
    }
  }, [initialDurationMs, endTimeMs]);

  const formatTime = (): string => {
    if (remainingMs <= 0) return format === 'compact' ? '0m' : '0 minutes';

    try {
      const duration = intervalToDuration({ start: 0, end: remainingMs });
      const { minutes = 0, seconds = 0, hours = 0 } = duration;

      // For times less than a minute but > 0, ensure we show at least "1m" or "< 1m"
      if (minutes === 0 && hours === 0 && seconds > 0 && !showSeconds) {
        return format === 'compact' ? '< 1m' : 'less than 1 minute';
      }

      const hasDays = (duration.days ?? 0) > 0;
      const hasHours = hours > 0 || hasDays;

      if (format === 'compact') {
        const parts: string[] = [];

        if (hasDays && duration.days) {
          parts.push(`${duration.days}d`);
        }

        if (hasHours) {
          parts.push(`${hours}h`);
        }

        if (minutes > 0 || (!hasHours && !hasDays)) {
          parts.push(`${minutes}m`);
        }

        if (showSeconds && seconds > 0 && !hasDays && (!hasHours || minutes === 0)) {
          parts.push(`${seconds}s`);
        }

        return parts.join(' ');
      } else {
        // Verbose format
        const parts: string[] = [];

        if (hasDays && duration.days) {
          parts.push(`${duration.days} ${duration.days === 1 ? 'day' : 'days'}`);
        }

        if (hasHours) {
          parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
        }

        if (minutes > 0 || (!hasHours && !hasDays)) {
          parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
        }

        if (showSeconds && seconds > 0 && !hasDays && !hasHours) {
          parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
        }

        return parts.join(' ');
      }
    } catch (e) {
      console.error('Error formatting duration:', e);

      // Fallback formatting
      const totalSeconds = Math.floor(remainingMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      if (format === 'compact') {
        return showSeconds && seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
      } else {
        const minuteText = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
        return showSeconds && seconds > 0
          ? `${minuteText} ${seconds} ${seconds === 1 ? 'second' : 'seconds'}`
          : minuteText;
      }
    }
  };

  return (
    <span className={className}>
      {prefix}
      {formatTime()}
      {suffix}
    </span>
  );
};
