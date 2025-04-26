import { cn } from '@/lib/utils';
import { useSidebar } from '@/shared/components/ui/sidebar';
import { useStore } from '@tanstack/react-store';
import { format } from 'date-fns';
import { useEffect, useRef } from 'react';
import { TasksList, TasksListHandle } from '../components/list/tasks-list';
import { WeekNavigator } from '../components/weekly-calendar/week-navigator';
import { isResizeInProgress, setFocused, tasksStore } from '../stores/tasks.store';

// Add a helper function to clear a stale resize flag after a timeout
const clearStaleResizeFlag = () => {
  // Only clear it if it's more than 10 seconds old
  // (in case a resize is actually in progress)
  const resizeStartTime = localStorage.getItem('resizeStartTime');
  const now = Date.now();

  if (resizeStartTime && now - parseInt(resizeStartTime) > 10000) {
    console.log('[Resize] Clearing stale resize flag');
    localStorage.removeItem('isResizingActive');
  }
};

export default function TodayPage() {
  const sidebar = useSidebar();
  const dayContentRef = useRef<TasksListHandle>(null);
  const isInitialLoadRef = useRef(true);

  const allTasks = useStore(tasksStore, (state) => state.tasks);
  const focusedTaskId = useStore(tasksStore, (state) => state.focusedTaskId);

  // Add cleanup on mount
  useEffect(() => {
    // Check if there's a stale resize flag on init and clear it
    // Use a timeout to make sure we don't interfere with actual resize operations
    const staleCheckTimeout = setTimeout(clearStaleResizeFlag, 3000);

    return () => {
      clearTimeout(staleCheckTimeout);
      // Also clear it on unmount to be safe
      localStorage.removeItem('isResizingActive');
    };
  }, []);

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

  // Effect for automatic focus checking
  useEffect(() => {
    const checkFocus = () => {
      // Skip automatic focus if a resize operation is in progress
      if (isResizeInProgress()) {
        console.log('[Focus Check] Skipping - resize operation in progress');
        return;
      }

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const tasksForToday = allTasks.filter((task) => task.taskDate === todayStr);
      // Sort tasks to ensure consistent order when checking intervals
      const sortedTasks = tasksForToday.sort(
        (a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0),
      );

      let taskToFocusNow: string | null = null;
      const now = new Date();

      for (const task of sortedTasks) {
        if (task.completed) continue;

        if (task.startTime && task.nextStartTime) {
          try {
            const startTime = task.startTime;
            const endTime = task.nextStartTime;

            if (now >= startTime && now < endTime) {
              taskToFocusNow = task.id;
              break;
            }
          } catch (error) {
            console.warn(`Invalid interval for task ${task.id}:`, error);
            continue;
          }
        }
      }

      // Get the currently focused task ID from the store *inside* the check
      // to ensure we have the latest value at the time of execution.
      const currentFocusedIdInStore = tasksStore.state.focusedTaskId;

      // If the calculated focus state differs from the store state
      if (taskToFocusNow !== currentFocusedIdInStore) {
        console.log(
          `[Focus Check] State change needed. Should be: ${taskToFocusNow ?? 'null'}, Is: ${currentFocusedIdInStore ?? 'null'}`,
        );
        // Unfocus the old task if there was one
        if (currentFocusedIdInStore) {
          console.log(`[Focus Check] Unfocusing task: ${currentFocusedIdInStore}`);
          // Unfocusing doesn't need options
          setFocused(currentFocusedIdInStore, false);
        }
        // Focus the new task if there is one
        if (taskToFocusNow) {
          console.log(`[Focus Check] Focusing task: ${taskToFocusNow}`);
          // Automatic focus should preserve existing time/date
          setFocused(taskToFocusNow, true, { preserveTimeAndDate: true });
        }
      }
    };

    // Initial check with a small delay
    const initialCheckTimeout = setTimeout(checkFocus, 100);

    // Check periodically
    const intervalId = setInterval(checkFocus, 15 * 1000); // Check every 15 seconds

    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(intervalId);
    };
    // Depend on allTasks so the check reruns if tasks change,
    // but focusedTaskId is handled inside checkFocus to avoid loops.
  }, [allTasks]);

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
