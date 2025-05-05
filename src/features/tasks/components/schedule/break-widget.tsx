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

// --- BreakWidget Component ---
interface BreakWidgetProps {
  classNames?: string;
  taskId: string;
  startTime: Date | undefined; // Used for reference, actual break will start now
  onAddBreak: (
    taskId: string,
    startTime: Date,
    durationInMs: number,
    breakType: 'during' | 'after',
  ) => void;
  breakType?: 'during' | 'after'; // Default to 'after' if not specified
  isActive: boolean; // Indicates if the parent task/gap is active
  isParentHovered: boolean; // Indicates if the parent component is hovered
}

export const BreakWidget: React.FC<BreakWidgetProps> = ({
  classNames,
  taskId,
  startTime,
  onAddBreak,
  breakType = 'after',
  isActive,
  isParentHovered, // Destructure the new prop
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
        isFinished: false,
      };

    let isFinished = false;
    if (selectedBreakDuration !== null && breakEndTimeMs) {
      isFinished = breakEndTimeMs < now;
      // If finished, explicitly set break active to false
      if (isFinished && isBreakActive) {
        // Using a timeout to avoid state update loop during render
        setTimeout(() => setIsBreakActive(false), 0);
      }
    }

    const isPast = startTime.getTime() < now;

    return { isPast, isFinished };
  }, [startTime, now, selectedBreakDuration, breakEndTimeMs, isBreakActive]);

  // --- Event Handlers ---
  const handleDecreaseBreak = () => {
    setBreakMinutes((prev) => Math.max(5, prev - 5));
  };

  const handleIncreaseBreak = () => {
    setBreakMinutes((prev) => Math.min(60, prev + 5));
  };

  const handleSetBreak = () => {
    if (!startTime) return;

    if (typeof onAddBreak === 'function') {
      const breakDurationMs = breakMinutes * 60 * 1000;
      const currentTime = new Date(); // Always start breaks NOW
      const endTimeMs = currentTime.getTime() + breakDurationMs;

      // Inform parent component about the break being set
      onAddBreak(taskId, currentTime, breakDurationMs, breakType);
      setSelectedBreakDuration(breakMinutes);
      setBreakEndTimeMs(endTimeMs);
      setIsBreakActive(true); // Start countdown immediately

      setIsPopoverOpen(false);
    } else {
      console.error('TakeBreak: onAddBreak is not a function', { startTime, breakType });
    }
  };

  // Handle countdown completion
  const handleCountdownComplete = () => {
    setIsBreakActive(false);
    // Keep breakEndTimeMs for record keeping, timeStatus.isFinished will handle the display change
  };

  // --- UI Helpers ---
  const getTooltipText = (): string => {
    if (isBreakActive) return 'Enjoy your break';
    if (timeStatus.isFinished) return `Recharged - ${selectedBreakDuration}m`;
    if (isActive) return 'Take a break';
    // If !isActive but hovered, it implies a finished break or just showing due to hover rule
    if (isParentHovered && !isActive) return 'Break available during active time';
    // Default fallback (should ideally not be reached if visibility logic is correct)
    return '';
  };

  const getButtonText = (): string => {
    return 'Start Break'; // Always immediate
  };

  const getIcon = () => {
    // Case 1: Break is finished
    if (timeStatus.isFinished) {
      if (selectedBreakDuration === 5) return <BatteryLow className="h-3.5 w-3.5 text-green-500" />;
      if (selectedBreakDuration === 10)
        return <BatteryMedium className="h-3.5 w-3.5 text-green-500" />;
      return <BatteryFull className="h-3.5 w-3.5 text-green-500" />;
    }

    // Case 2: Break is active and counting down
    if (isBreakActive && breakEndTimeMs) {
      return <BatteryCharging className="h-3.5 w-3.5 animate-pulse text-green-500" />;
    }

    // Case 3: Parent is hovered AND task/gap is active (allow starting a break)
    if (isParentHovered && isActive) {
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
          className="lucide lucide-battery-plus-icon lucide-battery-plus h-3.5 w-3.5"
        >
          <path d="M10 9v6" />
          <path d="M13.5 7H16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2.5" />
          <path d="M22 11v2" />
          <path d="M6.5 17H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2.5" />
          <path d="M7 12h6" />
        </svg>
      );
    }

    // None of the conditions to show an icon are met
    return null;
  };

  // --- Render Logic ---
  const iconElement = getIcon();

  // Determine if the widget should be visible at all
  const shouldShowWidget = useMemo(() => {
    // Always show if break is active or finished
    if (isBreakActive || timeStatus.isFinished) return true;
    // Show if parent is hovered (icon logic will determine if add icon is shown)
    if (isParentHovered) return true;
    // Otherwise, hide
    return false;
  }, [isBreakActive, timeStatus.isFinished, isParentHovered]);

  // Don't render anything if the base conditions (startTime, shouldShowWidget) aren't met,
  // or if getIcon returned null (meaning no relevant state to display visually)
  if (!startTime || !shouldShowWidget || !iconElement) {
    return null;
  }

  const tooltipText = getTooltipText();

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* Disable opening the popover unless the task/gap is active */}
            <PopoverTrigger asChild disabled={!isActive}>
              <Button
                variant="ghost"
                size="sm"
                className={`h-5 w-5 p-0 text-gray-400 hover:bg-transparent hover:text-gray-600 ${classNames}`}
                aria-label={tooltipText}
                // Prevent click events from bubbling up if the popover is disabled
                onClick={(e) => {
                  if (!isActive) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                <div className="relative flex items-center gap-1">
                  {iconElement}
                  {/* Show duration/countdown only when break is active and NOT finished */}
                  {isBreakActive && !timeStatus.isFinished && breakEndTimeMs && (
                    <span className="absolute left-6 top-0 text-xs font-medium">
                      <CountdownDisplay
                        endTimeMs={breakEndTimeMs}
                        isActive={isBreakActive}
                        onComplete={handleCountdownComplete}
                        className="text-xs font-medium"
                      />
                    </span>
                  )}
                  {/* Show finished duration text only when finished */}
                  {timeStatus.isFinished && selectedBreakDuration !== null && (
                    <span className="absolute left-6 top-0 text-xs font-medium text-green-600">
                      {selectedBreakDuration}m
                    </span>
                  )}
                </div>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          {/* Only show tooltip if there's text to display */}
          {tooltipText && (
            <TooltipContent>
              <p className="p-0 text-xs">{tooltipText}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      {/* Only render PopoverContent if it's possible to start a break (i.e., isActive) */}
      {isActive && (
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
      )}
    </Popover>
  );
};
