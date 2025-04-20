import { tasksStore } from '@/features/tasks/store/tasks.store';
import { OptimalTask } from '@/features/tasks/types';
import { ONE_HOUR_IN_MS } from '@/features/tasks/types/task.types';
import { format, isValid, parse } from 'date-fns';

/**
 * Converts a time string (HH:mm) to minutes since midnight
 * Returns null if the time string is invalid
 */
const getMinutesFromTimeString = (timeStr: string): number | null => {
  try {
    const parsed = parse(timeStr, 'HH:mm', new Date());
    if (!isValid(parsed)) return null;
    return parsed.getHours() * 60 + parsed.getMinutes();
  } catch {
    return null;
  }
};

/**
 * Core function to check if two time ranges overlap
 * Returns true if ranges overlap, false if they don't (including when they just touch)
 */
const doTimeRangesOverlap = (
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): boolean => {
  return start1 < end2 && end1 > start2;
};

type TimeSlotInfo = { startTime: string; duration: number };
type TaskInfo = { time?: string; duration?: number; completed?: boolean };

/**
 * Checks if a task or time slot overlaps with existing tasks
 * @param timeInfo Either a task object or {startTime: string, duration: number}
 * @param date The date to check against in 'yyyy-MM-dd' format
 * @param taskIdToExclude Optional task ID to exclude from overlap checking
 * @returns Object containing overlap status and array of overlapping tasks
 */
export const checkTimeOverlap = (
  timeInfo: TimeSlotInfo | TaskInfo,
  date: string,
  taskIdToExclude?: string,
): { hasOverlap: boolean; overlappingTasks: OptimalTask[] } => {
  // Get all tasks for the date except the excluded one and completed tasks
  const tasksOnDate = tasksStore.state.tasks.filter(
    (task) => task.taskDate === date && task.id !== taskIdToExclude && !task.completed,
  );

  if (tasksOnDate.length === 0) {
    return { hasOverlap: false, overlappingTasks: [] };
  }

  // If it's a completed task, no overlap
  if ('completed' in timeInfo && timeInfo.completed) {
    return { hasOverlap: false, overlappingTasks: [] };
  }

  // Get the start time string based on the input type
  const startTimeStr = 'startTime' in timeInfo ? timeInfo.startTime : timeInfo.time?.split('—')[0];
  if (!startTimeStr) {
    return { hasOverlap: false, overlappingTasks: [] };
  }

  const startTimeInMinutes = getMinutesFromTimeString(startTimeStr);
  if (startTimeInMinutes === null) {
    return { hasOverlap: false, overlappingTasks: [] };
  }

  const duration = timeInfo.duration || ONE_HOUR_IN_MS;
  const endTimeInMinutes = startTimeInMinutes + duration / 60000;

  const overlappingTasks = tasksOnDate.filter((task) => {
    if (!task.time) return false;

    const [taskStartTime] = task.time.split('—');
    const taskStartInMinutes = getMinutesFromTimeString(taskStartTime);
    if (taskStartInMinutes === null) return false;

    const taskDuration = task.duration || ONE_HOUR_IN_MS;
    const taskEndInMinutes = taskStartInMinutes + taskDuration / 60000;

    return doTimeRangesOverlap(
      startTimeInMinutes,
      endTimeInMinutes,
      taskStartInMinutes,
      taskEndInMinutes,
    );
  });

  return {
    hasOverlap: overlappingTasks.length > 0,
    overlappingTasks,
  };
};

/**
 * Checks if two tasks have overlapping time ranges
 */
export const hasTimeOverlap = (task1: OptimalTask, task2: OptimalTask): boolean => {
  // Early returns for invalid cases
  if (task1.completed || task2.completed || !task1.time || !task2.time) return false;

  const [start1Str] = task1.time.split('—');
  const [start2Str] = task2.time.split('—');
  if (!start1Str || !start2Str) return false;

  const start1 = getMinutesFromTimeString(start1Str);
  const start2 = getMinutesFromTimeString(start2Str);
  if (start1 === null || start2 === null) return false;

  const end1 = start1 + (task1.duration || ONE_HOUR_IN_MS) / 60000;
  const end2 = start2 + (task2.duration || ONE_HOUR_IN_MS) / 60000;

  return doTimeRangesOverlap(start1, end1, start2, end2);
};

/**
 * Checks if a new task with the given start time and duration would overlap with existing tasks
 */
export const hasTimeOverlapWithExistingTasks = (
  startTime: string,
  duration: number,
  date: string,
  taskIdToExclude?: string,
): { hasOverlap: boolean; overlappingTasks: OptimalTask[] } => {
  // Get tasks for the date, excluding completed tasks and the task being edited
  const tasksOnDate = tasksStore.state.tasks.filter(
    (task) => task.taskDate === date && task.id !== taskIdToExclude && !task.completed,
  );

  if (tasksOnDate.length === 0) {
    return { hasOverlap: false, overlappingTasks: [] };
  }

  // Convert new task time to minutes
  const newTaskStart = getMinutesFromTimeString(startTime);
  if (newTaskStart === null) {
    return { hasOverlap: false, overlappingTasks: [] };
  }

  const newTaskEnd = newTaskStart + duration / 60000;

  // Find overlapping tasks
  const overlappingTasks = tasksOnDate.filter((task) => {
    if (!task.time) return false;
    const [taskStartStr] = task.time.split('—');
    if (!taskStartStr) return false;

    const taskStart = getMinutesFromTimeString(taskStartStr);
    if (taskStart === null) return false;

    const taskEnd = taskStart + (task.duration || ONE_HOUR_IN_MS) / 60000;

    return doTimeRangesOverlap(newTaskStart, newTaskEnd, taskStart, taskEnd);
  });

  return {
    hasOverlap: overlappingTasks.length > 0,
    overlappingTasks,
  };
};

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
