import { OptimalTask } from '@/features/tasks/types';
import { addMilliseconds, format, isValid } from 'date-fns';

export const convertTaskToSchedulerProps = (task: OptimalTask) => {
  // Validate startTime before formatting
  let startTimeStr = '';
  if (task.startTime && isValid(task.startTime)) {
    startTimeStr = format(task.startTime, 'HH:mm');
  } else if (typeof task.time === 'string' && task.time.includes('—')) {
    // Fallback to extracting time from the time string if available
    startTimeStr = task.time.split('—')[0].trim();
  }

  // Calculate end time from start time and duration
  let endTimeStr = '';
  let endDate = null;

  if (task.startTime && isValid(task.startTime) && task.duration) {
    const endDateTime = addMilliseconds(task.startTime, task.duration);
    endTimeStr = format(endDateTime, 'HH:mm');
    endDate = endDateTime;
  } else if (typeof task.time === 'string' && task.time.includes('—')) {
    // Fallback to extracting end time from the time string if available
    endTimeStr = task.time.split('—')[1].trim();
  }

  return {
    startTime: startTimeStr,
    endTime: endTimeStr,
    startDate: task.dueDate && isValid(task.dueDate) ? task.dueDate : new Date(),
    endDate: endDate || (task.dueDate && isValid(task.dueDate) ? task.dueDate : new Date()),
    duration: task.duration,
  };
};
