import { DurationOption } from '@/features/tasks/components/schedule/duration-picker';
import { OptimalTask } from '@/features/tasks/types';
import { format } from 'date-fns';

export const convertTaskToSchedulerProps = (task: OptimalTask) => {
  // startTime is already in HH:mm format
  // Convert startTime from Date to string in HH:mm format
  const startTimeStr = format(task.startTime, 'HH:mm');
  // Convert duration from milliseconds to DurationOption
  const durationOption: DurationOption = {
    label:
      task.duration >= 3600000 ? `${task.duration / 3600000} hr` : `${task.duration / 60000} min`,
    millis: task.duration,
  };

  return {
    startTime: startTimeStr,
    duration: durationOption,
    startDate: task.dueDate,
  };
};
