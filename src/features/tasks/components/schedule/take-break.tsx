import { CountdownDisplay } from '@/shared/components/countdown-display';
import { Button } from '@/shared/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { BatteryCharging, BatteryFull, BatteryLow, BatteryMedium, Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// --- TakeBreak Component ---
interface TakeBreakProps {
  classNames?: string;
  taskId: string;
  startTime: Date | undefined; // Assumed to be the BREAK start time for simplicity
  // taskDurationInMs?: number; // Potentially needed if startTime is task start and breakType is 'after'
  onAddBreak: (
    taskId: string,
    startTime: Date,
    durationInMs: number,
    breakType: 'during' | 'after',
  ) => void;
  breakType?: 'during' | 'after'; // Default to 'after' if not specified
  // isPast?: boolean; // Removed, will calculate based on startTime
}

export const TakeBreak: React.FC<TakeBreakProps> = ({
  classNames,
  taskId,
  startTime,
  onAddBreak,
  breakType = 'after',
}) => {
  const [breakMinutes, setBreakMinutes] = useState<number>(15);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [selectedBreakDuration, setSelectedBreakDuration] = useState<number | null>(null); // Duration in minutes
  const [breakEndTimeMs, setBreakEndTimeMs] = useState<number | null>(null);
  const [isBreakActive, setIsBreakActive] = useState<boolean>(false);
  const [now, setNow] = useState(new Date().getTime());

  // Update 'now' periodically for accurate time comparisons
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date().getTime());
    }, 1000 * 30); // Update every 30 seconds
    return () => clearInterval(timer);
  }, []);

  // --- Derived State Calculation ---
  const timeStatus = useMemo(() => {
    if (!startTime)
      return {
        isPast: false,
        isFuture: false,
        isPresent: false,
        breakStartTimeMs: null,
        isFinished: false,
      };

    const breakStartTimeMs = startTime.getTime();
    // Consider a small buffer (e.g., 1 second) for determining 'present'
    const buffer = 1000;
    const isPast = breakStartTimeMs < now - buffer;
    const isFuture = breakStartTimeMs > now + buffer;
    const isPresent = !isPast && !isFuture;

    let isFinished = false;
    if (selectedBreakDuration !== null && !isFuture) {
      const breakDurationMs = selectedBreakDuration * 60 * 1000;
      const breakEndTimeMs = breakStartTimeMs + breakDurationMs;
      isFinished = breakEndTimeMs < now;
    }

    return { isPast, isFuture, isPresent, breakStartTimeMs, isFinished };
  }, [startTime, now, selectedBreakDuration]);

  // --- Event Handlers ---
  const handleDecreaseBreak = () => {
    setBreakMinutes((prev) => Math.max(5, prev - 5));
  };

  const handleIncreaseBreak = () => {
    setBreakMinutes((prev) => Math.min(60, prev + 5));
  };

  const handleSetBreak = () => {
    if (!startTime || !timeStatus.breakStartTimeMs) return;

    if (typeof onAddBreak === 'function') {
      const breakDurationMs = breakMinutes * 60 * 1000;
      const breakStartTimeMs = timeStatus.breakStartTimeMs;
      const endTimeMs = breakStartTimeMs + breakDurationMs;

      // Inform parent component about the break being set/marked
      onAddBreak(taskId, startTime, breakDurationMs, breakType);
      setSelectedBreakDuration(breakMinutes); // Set the selected duration
      setBreakEndTimeMs(endTimeMs); // Store the expected end time

      // Reset active state initially
      setIsBreakActive(false);

      if (!timeStatus.isFuture) {
        // Break is in the past or present
        if (endTimeMs > now) {
          // Break is ongoing (started in past or starting now)
          setIsBreakActive(true); // Start countdown
        }
        // If breakEndTimeMs <= now, it's fully in the past, do nothing more (already marked)
      }
      // If break is in the future, setting selectedBreakDuration is enough, useEffect will handle activation

      setIsPopoverOpen(false);
    } else {
      console.error('TakeBreak: onAddBreak is not a function', { startTime, breakType });
    }
  };

  // --- Future Break Activation Effect ---
  useEffect(() => {
    if (
      !isBreakActive &&
      selectedBreakDuration !== null &&
      timeStatus.isFuture &&
      timeStatus.breakStartTimeMs
    ) {
      const delay = timeStatus.breakStartTimeMs - now;
      if (delay <= 0) return; // Should not happen if isFuture is true, but safety check

      const timeoutId = setTimeout(() => {
        // Check again if still relevant when timer fires
        const currentNow = new Date().getTime();
        const breakEndTimeMs = timeStatus.breakStartTimeMs! + selectedBreakDuration * 60 * 1000;
        if (currentNow < breakEndTimeMs) {
          // Only activate if not already ended
          setBreakEndTimeMs(breakEndTimeMs);
          setIsBreakActive(true);
        }
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedBreakDuration, timeStatus.isFuture, timeStatus.breakStartTimeMs, isBreakActive, now]); // Re-evaluate when these change

  // Handle countdown completion
  const handleCountdownComplete = () => {
    setIsBreakActive(false);
    setBreakEndTimeMs(null);
  };

  // --- UI Helpers ---
  const getTooltipText = (): string => {
    if (isBreakActive) return 'Enjoy your break';
    if (timeStatus.isFinished) return `Recharged - ${selectedBreakDuration}m`; // Finished in the past
    if (selectedBreakDuration !== null) {
      if (timeStatus.isPast) return `Recharged - ${selectedBreakDuration}m`; // Marked past break
      return `Break scheduled - ${selectedBreakDuration}m`; // Scheduled for future or present (but not active yet)
    }
    // No break set yet
    if (timeStatus.isPast) return 'Mark past time as break?';
    return 'Take a break'; // Future or present, ready to set
  };

  const getButtonText = (): string => {
    if (timeStatus.isPast && selectedBreakDuration === null) return 'Mark as Break';
    if (timeStatus.isFuture) return 'Schedule Break';
    return 'Set Break'; // Default for present or if already set
  };

  const getIcon = () => {
    // Case 1: Break is finished, or marked in the past
    if (timeStatus.isFinished || (timeStatus.isPast && selectedBreakDuration !== null)) {
      // Choose icon based on duration
      if (selectedBreakDuration === 5) {
        return <BatteryLow className="h-3.5 w-3.5" />;
      } else if (selectedBreakDuration === 10) {
        return <BatteryMedium className="h-3.5 w-3.5" />;
      } else {
        // Default to Full for 15+ minutes or if duration is somehow null (shouldn't happen here)
        return <BatteryFull className="h-3.5 w-3.5" />;
      }
    }
    // Case 2: Break time is in the past, but not yet marked
    if (timeStatus.isPast && selectedBreakDuration === null) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-battery-plus-icon lucide-battery-plus"
        >
          <path d="M10 9v6" />
          <path d="M13.5 7H16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2.5" />
          <path d="M22 11v2" />
          <path d="M6.5 17H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2.5" />
          <path d="M7 12h6" />
        </svg>
      ); // Past, unmarked
    }
    // Case 3: Break is active (present/ongoing) or scheduled (future/present)
    return (
      <BatteryCharging
        className={`h-3.5 w-3.5 ${isBreakActive ? 'animate-pulse text-green-500' : ''}`}
      />
    ); // Present / Future / Active
  };

  if (!startTime) return null; // Don't render if startTime is missing

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-5 w-5 p-0 text-gray-400 hover:bg-transparent hover:text-gray-600 ${classNames}`}
                aria-label={getTooltipText()} // Use tooltip text for aria-label
                // Disable if break is finished? Or allow changing past breaks? For now, allow.
                // disabled={timeStatus.isFinished}
              >
                <div className="relative flex items-center gap-1">
                  {getIcon()}
                  {selectedBreakDuration !== null &&
                    !timeStatus.isFinished && ( // Show duration if set and not fully past
                      <span className="absolute left-6 top-0 text-xs font-medium">
                        {isBreakActive && breakEndTimeMs ? (
                          <CountdownDisplay
                            endTimeMs={breakEndTimeMs}
                            isActive={isBreakActive}
                            onComplete={handleCountdownComplete}
                            className="text-xs font-medium"
                          />
                        ) : (
                          `${selectedBreakDuration}m`
                        )}
                      </span>
                    )}
                </div>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="p-0 text-xs">{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-auto p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={handleDecreaseBreak}
            disabled={breakMinutes <= 5}
            aria-label="Decrease break time"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="min-w-[40px] text-center text-sm font-medium">{breakMinutes}m</span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={handleIncreaseBreak}
            disabled={breakMinutes >= 60}
            aria-label="Increase break time"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button size="sm" className="h-6 px-2 text-xs" onClick={handleSetBreak}>
            {getButtonText()}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
