import { useSidebar } from '@/shared/components/ui/sidebar';
import { useStore } from '@tanstack/react-store';
import { isWithinInterval, parseISO } from 'date-fns';
import { useEffect, useRef } from 'react';
import { cn } from '../../../lib/utils';
import { TasksList } from '../components/list/tasks-list';
import { WeekNavigator } from '../components/weekly-calendar/week-navigator';
import { setAutomaticFocus, tasksStore } from '../store/tasks.store';

export default function TodayPage() {
  const sidebar = useSidebar();
  const dayContentRef = useRef<{ setIsCreating: (value: boolean) => void } | null>(null);
  const lastFocusStateRef = useRef<{ taskId: string | null; timestamp: number }>({
    taskId: null,
    timestamp: 0,
  });

  const allTasks = useStore(tasksStore, (state) => state.tasks);
  const focusedTaskId = useStore(tasksStore, (state) => state.focusedTaskId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no input/textarea is focused
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        dayContentRef.current?.setIsCreating(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Effect for automatic focus check
  useEffect(() => {
    const checkFocus = () => {
      const now = new Date();
      let currentlyFocusedTask = null;

      // Find the first non-completed task whose time interval includes the current time
      for (const task of allTasks) {
        if (task.completed) continue;
        if (task.startTime && task.nextStartTime) {
          try {
            // Ensure startTime and nextStartTime are Date objects
            const startTime =
              typeof task.startTime === 'string' ? parseISO(task.startTime) : task.startTime;
            const endTime =
              typeof task.nextStartTime === 'string'
                ? parseISO(task.nextStartTime)
                : task.nextStartTime;

            // Validate that both times are valid Date objects and startTime is before endTime
            if (
              startTime instanceof Date &&
              endTime instanceof Date &&
              !isNaN(startTime.getTime()) &&
              !isNaN(endTime.getTime()) &&
              startTime < endTime
            ) {
              if (isWithinInterval(now, { start: startTime, end: endTime })) {
                currentlyFocusedTask = task.id;
                break; // Found the first overlapping task
              }
            }
          } catch (error) {
            console.warn(`Invalid interval for task ${task.id}:`, error);
            continue;
          }
        }
      }

      const currentTime = Date.now();
      const timeSinceLastFocus = currentTime - lastFocusStateRef.current.timestamp;
      const MIN_FOCUS_INTERVAL = 2000; // 2 seconds minimum between focus changes

      // Only update if:
      // 1. The automatically determined focus differs from the current state
      // 2. Enough time has passed since the last focus change
      // 3. The new focus state is different from the last recorded focus state
      if (
        currentlyFocusedTask !== focusedTaskId &&
        timeSinceLastFocus > MIN_FOCUS_INTERVAL &&
        currentlyFocusedTask !== lastFocusStateRef.current.taskId
      ) {
        lastFocusStateRef.current = {
          taskId: currentlyFocusedTask,
          timestamp: currentTime,
        };
        setAutomaticFocus(currentlyFocusedTask);
      }
    };

    // Initial check with a small delay to avoid immediate re-renders
    const initialCheckTimeout = setTimeout(checkFocus, 100);

    // Check every minute after the initial check
    const intervalId = setInterval(checkFocus, 60 * 1000);

    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(intervalId);
    };
  }, [allTasks, focusedTaskId]);

  // Don't add any code here that would reset scroll position
  // Let the router handle scroll restoration

  return (
    <div
      className={cn(
        'flex h-[calc(100vh-4rem)] bg-sidebar transition-all duration-100',
        'flex-col text-white',
      )}
    >
      {/* Week Navigator */}
      <div className="borderbg-background flex-1 rounded-t-2xl">
        <WeekNavigator className="border-secondary-500 rounded-t-2xl border-b" />
      </div>
      {/* Day Content */}
      <div className="h-full bg-background pb-4 shadow-[0_4px_10px_-4px_rgba(0,0,0,0.1)]">
        <TasksList ref={dayContentRef} />
      </div>
    </div>
  );
}
