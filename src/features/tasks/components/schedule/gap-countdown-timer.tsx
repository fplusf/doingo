import { differenceInMilliseconds, intervalToDuration } from 'date-fns';
import { useEffect, useState } from 'react';

interface GapCountdownTimerProps {
  endTime: Date; // The start time of the next task
}

// Formats duration object into "Xm Ys" or just "Xm" or "<1m"
const formatCountdown = (duration: Duration): string => {
  const minutes = duration.minutes ?? 0;
  const seconds = duration.seconds ?? 0;

  if (minutes > 0) {
    return `${minutes}m${seconds > 0 ? ` ${seconds}s` : ''}`;
  } else if (seconds > 0) {
    return `${seconds}s`;
  } else {
    return '<1m'; // Or indicate it's about to start
  }
};

export const GapCountdownTimer: React.FC<GapCountdownTimerProps> = ({ endTime }) => {
  const [remainingTimeStr, setRemainingTimeStr] = useState<string>('');

  useEffect(() => {
    const calculateAndSetRemainingTime = () => {
      const now = new Date();
      const msRemaining = differenceInMilliseconds(endTime, now);

      if (msRemaining <= 0) {
        setRemainingTimeStr('Starting...'); // Or handle completion
        clearInterval(intervalId); // Stop the timer
        return;
      }

      const duration = intervalToDuration({ start: 0, end: msRemaining });
      setRemainingTimeStr(formatCountdown(duration));
    };

    // Initial calculation
    calculateAndSetRemainingTime();

    // Update every second
    const intervalId = setInterval(calculateAndSetRemainingTime, 1000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [endTime]); // Rerun effect if endTime changes

  return <span className="font-medium">{remainingTimeStr}</span>;
};
