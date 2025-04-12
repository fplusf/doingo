// Calculate the next 15-minute interval from the current time
import { tasksStore } from '@/features/tasks/store/tasks.store';
import { OptimalTask } from '@/features/tasks/types';
import {
  addMilliseconds,
  addMinutes,
  format,
  getMinutes,
  setMilliseconds,
  setMinutes,
  setSeconds,
} from 'date-fns';

export const getNextFifteenMinuteInterval = (): Date => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;

  const result = new Date(now);
  result.setMinutes(roundedMinutes);
  result.setSeconds(0);
  result.setMilliseconds(0);

  // If we rounded to 60 minutes, we need to add an hour and set minutes to 0
  if (roundedMinutes === 60) {
    result.setHours(result.getHours() + 1);
    result.setMinutes(0);
  }

  return result;
};

/**
 * Checks if a new task with the given start time and duration would overlap with existing tasks
 */
export const hasTimeOverlapWithExistingTasks = (
  startTimeString: string,
  durationMs: number,
  date: string,
  taskIdToExclude?: string,
): { hasOverlap: boolean; overlappingTasks: OptimalTask[] } => {
  const tasks = tasksStore.state.tasks;
  const tasksOnDate = tasks.filter((task) => task.taskDate === date && task.id !== taskIdToExclude);

  if (tasksOnDate.length === 0) return { hasOverlap: false, overlappingTasks: [] };

  // Parse the start time
  const [hours, minutes] = startTimeString.split(':').map(Number);
  const startTimeInMinutes = hours * 60 + minutes;
  const endTimeInMinutes = startTimeInMinutes + durationMs / (60 * 1000);

  const overlappingTasks = tasksOnDate.filter((task) => {
    if (!task.time) return false;

    const [taskStartTime] = task.time.split('—');
    const [taskHours, taskMinutes] = taskStartTime.split(':').map(Number);
    const taskStartInMinutes = taskHours * 60 + taskMinutes;
    const taskDuration = task.duration || 60 * 60 * 1000; // Default 1 hour
    const taskEndInMinutes = taskStartInMinutes + taskDuration / (60 * 1000);

    // Check if time ranges overlap
    return startTimeInMinutes < taskEndInMinutes && endTimeInMinutes > taskStartInMinutes;
  });

  return {
    hasOverlap: overlappingTasks.length > 0,
    overlappingTasks,
  };
};

/**
 * Finds the next available time slot after the given tasks
 */
export const findNextAvailableTimeSlot = (date: string): string => {
  const tasks = tasksStore.state.tasks;
  const tasksOnDate = tasks.filter((task) => task.taskDate === date);

  // If no tasks for this date, use the next 15-minute interval
  if (tasksOnDate.length === 0) {
    return format(getNextFifteenMinuteInterval(), 'HH:mm');
  }

  // Get the current time
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeInMinutes = currentHours * 60 + currentMinutes;

  // Find the latest ending task regardless of whether it's in the past or future
  // This fixes the issue of always suggesting the same time for the third task onward
  // Sort tasks by end time (not just future tasks)
  const sortedByEndTime = [...tasksOnDate].sort((a, b) => {
    if (!a.time || !b.time) return 0;

    const [aStartTime] = a.time.split('—');
    const [bStartTime] = b.time.split('—');

    const [aHours, aMinutes] = aStartTime.split(':').map(Number);
    const [bHours, bMinutes] = bStartTime.split(':').map(Number);

    const aStartInMinutes = aHours * 60 + aMinutes;
    const bStartInMinutes = bHours * 60 + bMinutes;

    const aDuration = a.duration || 60 * 60 * 1000; // Default 1 hour
    const bDuration = b.duration || 60 * 60 * 1000; // Default 1 hour

    const aEndInMinutes = aStartInMinutes + aDuration / (60 * 1000);
    const bEndInMinutes = bStartInMinutes + bDuration / (60 * 1000);

    // Sort by end time in descending order to get the latest ending task first
    return bEndInMinutes - aEndInMinutes;
  });

  // Get the latest ending task
  const latestEndingTask = sortedByEndTime[0];

  // If no valid task exists, use the next 15-minute interval
  if (!latestEndingTask || !latestEndingTask.time) {
    return format(getNextFifteenMinuteInterval(), 'HH:mm');
  }

  // Calculate the end time of the latest task
  const [taskStartTime] = latestEndingTask.time.split('—');
  const [taskHours, taskMinutes] = taskStartTime.split(':').map(Number);
  const taskStartDate = new Date();
  taskStartDate.setHours(taskHours, taskMinutes, 0, 0);

  const taskDuration = latestEndingTask.duration || 60 * 60 * 1000; // Default 1 hour
  const endTime = addMilliseconds(taskStartDate, taskDuration);

  // If the end time is earlier than now, use next 15-minute interval
  const endTimeInMinutes = endTime.getHours() * 60 + endTime.getMinutes();
  if (endTimeInMinutes <= currentTimeInMinutes) {
    return format(getNextFifteenMinuteInterval(), 'HH:mm');
  }

  // Round to the next 15-minute interval
  const endMinutes = endTime.getMinutes();
  const roundedMinutes = Math.ceil(endMinutes / 15) * 15;

  endTime.setMinutes(roundedMinutes);
  endTime.setSeconds(0);
  endTime.setMilliseconds(0);

  // If rounded to 60 minutes, add an hour and set minutes to 0
  if (roundedMinutes === 60) {
    endTime.setHours(endTime.getHours() + 1);
    endTime.setMinutes(0);
  }

  return format(endTime, 'HH:mm');
};

/**
 * Find available free time slots between tasks where a task with the specified duration could fit
 * Returns an array of time slots in "HH:mm" format
 */
export const findFreeTimeSlots = (date: string, duration: number): string[] => {
  const tasks = tasksStore.state.tasks;
  const tasksOnDate = tasks.filter((task) => task.taskDate === date);

  // If there are no tasks or only one task, there are no "between" slots
  if (tasksOnDate.length <= 1) {
    return [];
  }

  // Get the current time
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeInMinutes = currentHours * 60 + currentMinutes;

  // Parse all tasks into time ranges (start and end times in minutes)
  const timeRanges = tasksOnDate
    .filter((task) => task.time) // Only consider tasks with a time
    .map((task) => {
      const [taskStartTime] = task.time!.split('—');
      const [hours, minutes] = taskStartTime.split(':').map(Number);
      const startTimeInMinutes = hours * 60 + minutes;
      const taskDuration = task.duration || 60 * 60 * 1000; // Default 1 hour
      const endTimeInMinutes = startTimeInMinutes + taskDuration / (60 * 1000);

      return {
        start: startTimeInMinutes,
        end: endTimeInMinutes,
        task,
      };
    })
    // Sort by start time
    .sort((a, b) => a.start - b.start);

  // Find gaps between tasks that are large enough for the new task
  const freeSlots: string[] = [];

  for (let i = 0; i < timeRanges.length - 1; i++) {
    const currentTaskEnd = timeRanges[i].end;
    const nextTaskStart = timeRanges[i + 1].start;

    // The gap size in minutes
    const gapSize = nextTaskStart - currentTaskEnd;

    // The required gap size for the new task (in minutes) plus a small buffer
    const requiredGapSize = duration / (60 * 1000);

    // If the gap is large enough and the slot is in the future
    if (gapSize >= requiredGapSize && currentTaskEnd > currentTimeInMinutes) {
      // Round the start time to the nearest 15-minute interval
      const roundedMinutes = Math.ceil((currentTaskEnd % 60) / 15) * 15;
      const slotHour = Math.floor(currentTaskEnd / 60) + (roundedMinutes >= 60 ? 1 : 0);
      const slotMinute = roundedMinutes >= 60 ? roundedMinutes - 60 : roundedMinutes;

      // Format the time string
      const timeString = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;

      freeSlots.push(timeString);
    }
  }

  return freeSlots;
};

/**
 * Calculates the next 5-minute interval from the given date.
 * If the current time is exactly on a 5-minute mark, it returns that mark.
 * Otherwise, it rounds up to the nearest future 5-minute mark.
 * Example: 10:02 -> 10:05, 10:05 -> 10:05, 10:08 -> 10:10
 * @param date - The date object to calculate from (defaults to now).
 * @returns A new Date object set to the next 5-minute interval.
 */
export const getNextFiveMinuteInterval = (date: Date = new Date()): Date => {
  const minutes = getMinutes(date);
  const remainder = minutes % 5;

  let nextInterval = setSeconds(setMilliseconds(date, 0), 0); // Clear seconds and ms

  if (remainder === 0) {
    // Already on a 5-minute mark
    return nextInterval;
  } else {
    // Round up to the next 5-minute mark
    const minutesToAdd = 5 - remainder;
    nextInterval = addMinutes(nextInterval, minutesToAdd);
    // Ensure minutes are explicitly set after adding, correcting potential date-fns edge cases
    return setMinutes(nextInterval, Math.ceil(getMinutes(date) / 5) * 5);
  }
};
