import { DurationOption } from '@/features/tasks/components/schedule/duration-picker';
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

  // Convert duration from milliseconds to DurationOption
  const durationOption: DurationOption = {
    label:
      task.duration >= 3600000 ? `${task.duration / 3600000} hr` : `${task.duration / 60000} min`,
    millis: task.duration,
  };

  return {
    startTime: startTimeStr,
    duration: durationOption,
    startDate: task.dueDate && isValid(task.dueDate) ? task.dueDate : new Date(),
  };
};
