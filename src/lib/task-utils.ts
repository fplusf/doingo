import { OptimalTask } from '@/features/tasks/types';
import { format, isValid } from 'date-fns';

export const convertTaskToSchedulerProps = (task: OptimalTask) => {
  // Validate startTime before formatting
  let startTimeStr = '';
  if (task.startTime && isValid(task.startTime)) {
    startTimeStr = format(task.startTime, 'HH:mm');
  } else if (typeof task.time === 'string' && task.time.includes('—')) {
    // Fallback to extracting time from the time string if available
    startTimeStr = task.time.split('—')[0].trim();
  }

  // Get due time from task
  let dueTimeStr = '';

  // Only use explicit dueTime if available
  if (task.dueTime) {
    dueTimeStr = task.dueTime;
  }

  return {
    startTime: startTimeStr,
    dueTime: dueTimeStr || undefined,
    startDate: task.dueDate || new Date(),
    dueDate: task.dueDate || undefined,
    duration: task.duration,
  };
};
