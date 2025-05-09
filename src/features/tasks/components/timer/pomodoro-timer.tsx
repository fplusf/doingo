import {
  getCurrentPomodoroState,
  TimerMode as GlobalTimerMode,
  TimerState as GlobalTimerState,
  pausePomodoroTimer,
  resetPomodoroTimer,
  setGlobalBreakDuration,
  setGlobalPomodoroDuration,
  startPomodoroTimer,
  subscribeToGlobalTimer,
  switchPomodoroMode,
} from '@/features/tasks/services/global-pomodoro-timer.service';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { BatteryCharging, BatteryPlus, Pause, Play, RotateCcw, TimerIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ElectronApi } from '../../../../shared/types/electron';
import { SessionIndicator } from './session-indicator';

declare global {
  interface Window {
    electron?: ElectronApi;
  }
}

interface PomodoroTimerProps {
  className?: string;
  onStateChange?: (isRunning: boolean) => void;
  taskId: string;
  onAddBreak: (
    taskId: string,
    startTime: Date,
    duration: number,
    breakType: 'during' | 'after',
  ) => void;
  totalDuration?: number;
}

const POMODORO_DURATIONS = [
  { label: '15 min', value: 15 * 60 * 1000 },
  { label: '20 min', value: 20 * 60 * 1000 },
  { label: '25 min', value: 25 * 60 * 1000 },
  { label: '30 min', value: 30 * 60 * 1000 },
  { label: '45 min', value: 45 * 60 * 1000 },
  { label: '50 min', value: 50 * 60 * 1000 },
  { label: '60 min', value: 60 * 60 * 1000 },
  { label: '90 min', value: 90 * 60 * 1000 },
];

const BREAK_DURATIONS = [
  { label: '5 min', value: 5 * 60 * 1000 },
  { label: '10 min', value: 10 * 60 * 1000 },
  { label: '15 min', value: 15 * 60 * 1000 },
  { label: '20 min', value: 20 * 60 * 1000 },
  { label: '30 min', value: 30 * 60 * 1000 },
];

const formatDisplayTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const PomodoroTimer = ({
  className,
  onStateChange,
  taskId,
  onAddBreak,
  totalDuration = 2 * 60 * 60 * 1000, // Default 2 hours
}: PomodoroTimerProps) => {
  const [displayState, setDisplayState] = useState<GlobalTimerState>(getCurrentPomodoroState());
  const [showBreakWidget, setShowBreakWidget] = useState(false);
  const [currentSession, setCurrentSession] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToGlobalTimer((newGlobalState: GlobalTimerState) => {
      setDisplayState(newGlobalState);
      if (onStateChange && newGlobalState.currentTaskId === taskId) {
        onStateChange(newGlobalState.isRunning);
      }
      const previousState = displayState;

      // Track session progress
      if (
        previousState.activeMode === 'pomodoro' &&
        !previousState.isRunning &&
        newGlobalState.currentTaskId === taskId &&
        newGlobalState.activeMode === 'break' &&
        newGlobalState.remainingTime === newGlobalState.breakDuration &&
        !newGlobalState.isRunning
      ) {
        setShowBreakWidget(true);
        setCurrentSession((prev) => prev + 1);
      }
    });

    const currentGlobalState = getCurrentPomodoroState();
    if (currentGlobalState.currentTaskId === taskId) {
      setDisplayState(currentGlobalState);
    } else {
      setDisplayState({
        ...currentGlobalState,
        currentTaskId: taskId,
        isRunning: false,
        activeMode: 'pomodoro',
        remainingTime: currentGlobalState.pomodoroDuration,
        sessionStartTime: null,
        pomodoroDuration: currentGlobalState.pomodoroDuration,
        breakDuration: currentGlobalState.breakDuration,
      });
    }

    return () => {
      unsubscribe();
    };
  }, [taskId, onStateChange, displayState]);

  const handleToggle = useCallback(() => {
    const currentGlobalState = getCurrentPomodoroState();
    if (
      currentGlobalState.currentTaskId !== null &&
      currentGlobalState.currentTaskId !== taskId &&
      currentGlobalState.isRunning
    ) {
      console.warn('Timer is active for another task.');
      return;
    }

    if (displayState.isRunning && displayState.currentTaskId === taskId) {
      pausePomodoroTimer();
    } else {
      startPomodoroTimer(taskId, displayState.activeMode, undefined, true);
    }
  }, [taskId, displayState.isRunning, displayState.activeMode, displayState.currentTaskId]);

  const handleReset = useCallback(() => {
    resetPomodoroTimer(taskId);
    setShowBreakWidget(false);
  }, [taskId]);

  const handleModeChangeFromUI = useCallback(
    (newUIMode: string) => {
      const newMode = newUIMode as GlobalTimerMode;
      if (!newMode) return;
      switchPomodoroMode(newMode, taskId);
    },
    [taskId],
  );

  const handlePomodoroDurationChange = useCallback((newDuration: number) => {
    setGlobalPomodoroDuration(newDuration);
  }, []);

  const handleBreakDurationChange = useCallback((newDuration: number) => {
    setGlobalBreakDuration(newDuration);
  }, []);

  const handleManualBreakStart = useCallback(() => {
    if (displayState.currentTaskId === taskId && displayState.activeMode === 'break') {
      startPomodoroTimer(taskId, 'break', displayState.breakDuration, false);
      setShowBreakWidget(false);
    } else if (
      displayState.currentTaskId === taskId &&
      displayState.activeMode === 'pomodoro' &&
      !displayState.isRunning
    ) {
      switchPomodoroMode('break', taskId);
      startPomodoroTimer(taskId, 'break', displayState.breakDuration, false);
      setShowBreakWidget(false);
    }
  }, [
    taskId,
    displayState.currentTaskId,
    displayState.activeMode,
    displayState.isRunning,
    displayState.breakDuration,
  ]);

  const {
    isRunning,
    activeMode,
    remainingTime,
    pomodoroDuration,
    breakDuration,
    currentTaskId: activeTimerTaskId,
  } = displayState;

  const isTimerEffectivelyForThisTask = activeTimerTaskId === taskId;
  const isGlobalTimerLockedByOtherTask =
    activeTimerTaskId !== null && activeTimerTaskId !== taskId && isRunning;

  return (
    <TooltipProvider>
      <div className={cn('flex max-w-[200px] flex-col items-center gap-2', className)}>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className={cn(
                  'flex h-6 min-w-[4.5rem] cursor-pointer select-none items-center justify-center rounded-md px-2 py-1 font-mono text-xs font-medium tabular-nums',
                  isTimerEffectivelyForThisTask && activeMode === 'break'
                    ? 'bg-green-600/20 text-green-500'
                    : 'bg-blue-500/20 text-blue-500',
                )}
                tabIndex={0}
                aria-label="Change timer duration"
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
                }}
              >
                {formatDisplayTime(
                  isTimerEffectivelyForThisTask ? remainingTime : pomodoroDuration,
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-28 min-w-28" side="bottom" align="end">
              {(isTimerEffectivelyForThisTask && activeMode === 'pomodoro') || !activeTimerTaskId
                ? POMODORO_DURATIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handlePomodoroDurationChange(option.value)}
                      disabled={isGlobalTimerLockedByOtherTask}
                      className={cn(
                        'ml-5 flex items-center',
                        pomodoroDuration === option.value && 'font-bold',
                      )}
                    >
                      <span className="absolute -left-3">
                        {pomodoroDuration === option.value && '✓ '}
                      </span>
                      {option.label}
                    </DropdownMenuItem>
                  ))
                : BREAK_DURATIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleBreakDurationChange(option.value)}
                      disabled={isGlobalTimerLockedByOtherTask}
                      className={cn(
                        'ml-5 flex items-center',
                        breakDuration === option.value && 'font-bold',
                      )}
                    >
                      <span className="absolute -left-3">
                        {breakDuration === option.value && '✓ '}
                      </span>
                      {option.label}
                    </DropdownMenuItem>
                  ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                {(isTimerEffectivelyForThisTask && activeMode === 'pomodoro') || !activeTimerTaskId
                  ? 'Pomodoro'
                  : 'Break'}{' '}
                duration
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ToggleGroup
            type="single"
            value={isTimerEffectivelyForThisTask ? activeMode : 'pomodoro'}
            disabled={isGlobalTimerLockedByOtherTask}
            onValueChange={handleModeChangeFromUI}
            className="flex"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="pomodoro"
                  disabled={
                    isGlobalTimerLockedByOtherTask ||
                    (isRunning && isTimerEffectivelyForThisTask && activeMode !== 'pomodoro')
                  }
                  aria-label="Pomodoro mode"
                  className={cn(
                    'h-6 w-6 p-0',
                    isTimerEffectivelyForThisTask &&
                      activeMode === 'pomodoro' &&
                      'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 hover:text-blue-600',
                  )}
                >
                  <TimerIcon />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pomodoro</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="break"
                  disabled={
                    isGlobalTimerLockedByOtherTask ||
                    (isRunning && isTimerEffectivelyForThisTask && activeMode !== 'break')
                  }
                  aria-label="Break mode"
                  className={cn(
                    'h-6 w-6 p-0',
                    isTimerEffectivelyForThisTask &&
                      activeMode === 'break' &&
                      'bg-green-500/20 text-green-500 hover:bg-green-500/30 hover:text-green-600',
                  )}
                >
                  {isRunning && isTimerEffectivelyForThisTask ? (
                    <BatteryCharging className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <BatteryPlus className="h-5 w-5" aria-hidden="true" />
                  )}
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Break</p>
              </TooltipContent>
            </Tooltip>
          </ToggleGroup>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleToggle}
                disabled={isGlobalTimerLockedByOtherTask}
                aria-label={
                  isRunning && isTimerEffectivelyForThisTask ? 'Pause Timer' : 'Start Timer'
                }
              >
                {isRunning && isTimerEffectivelyForThisTask ? (
                  <Pause className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <Play className="h-3 w-3" aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isRunning && isTimerEffectivelyForThisTask ? 'Pause Timer' : 'Start Timer'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleReset}
                disabled={
                  isGlobalTimerLockedByOtherTask ||
                  (!isTimerEffectivelyForThisTask && !isRunning && activeTimerTaskId == null)
                }
                aria-label="Reset Timer"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset Timer</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <SessionIndicator
          totalDuration={totalDuration}
          currentSession={currentSession}
          className="ml-0 self-start"
          pomodoroDuration={pomodoroDuration}
          breakDuration={breakDuration}
        />
      </div>
    </TooltipProvider>
  );
};
