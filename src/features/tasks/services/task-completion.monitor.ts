import { showTaskCompletionNotification } from '@/shared/helpers/notification.helper';
import { isPast, isToday } from 'date-fns';
import { tasksStore } from '../stores/tasks.store';

let checkingInterval: NodeJS.Timeout | null = null;
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

const notifiedTaskIds = new Set<string>();

const checkAndNotifyForFinishedTasks = () => {
  const { tasks } = tasksStore.state;
  const now = new Date();

  tasks.forEach((task) => {
    // Only check tasks for today that have a defined end time
    if (task.nextStartTime && isToday(new Date(task.nextStartTime))) {
      const endTime = new Date(task.nextStartTime);

      // Check if the task's end time is in the past and it hasn't been notified yet
      if (isPast(endTime) && !notifiedTaskIds.has(task.id)) {
        // Simple check to avoid notifying for tasks that ended long ago,
        // e.g., when the app is opened for the first time.
        // We'll only notify for tasks that ended within the last check interval.
        const minutesSinceEnd = (now.getTime() - endTime.getTime()) / 60000;
        if (minutesSinceEnd < 5) {
          // Notify if ended in the last 5 minutes
          showTaskCompletionNotification(
            'Task Finished',
            `Your scheduled time for "${task.title}" has ended.`,
          );
          notifiedTaskIds.add(task.id);

          // Optional: Clean up old notified IDs to prevent memory leak over long sessions
          // For now, we'll keep it simple. A more robust solution might use a timestamp.
        }
      }
    }
  });
};

export const startTaskCompletionMonitor = () => {
  if (checkingInterval) {
    console.log('Task completion monitor is already running.');
    return;
  }
  console.log('Starting task completion monitor...');
  checkAndNotifyForFinishedTasks(); // Initial check
  checkingInterval = setInterval(checkAndNotifyForFinishedTasks, CHECK_INTERVAL_MS);
};

export const stopTaskCompletionMonitor = () => {
  if (checkingInterval) {
    console.log('Stopping task completion monitor.');
    clearInterval(checkingInterval);
    checkingInterval = null;
  }
};
