import { addMilliseconds, differenceInMilliseconds, format } from 'date-fns';
import { FIFTEEN_MINUTES_IN_MS, GapType, OptimalTask } from '../types/task.types';

// Sort tasks within each category by start time
export const sortByStartTime = (tasks: OptimalTask[]): OptimalTask[] => {
  return [...tasks].sort((a, b) => {
    const aTime = a.startTime || new Date(0); // Use startTime Date object
    const bTime = b.startTime || new Date(0);
    return aTime.getTime() - bTime.getTime();
  });
};

// Function to process tasks and insert gap items
export const processTasksWithGaps = (tasks: OptimalTask[]): OptimalTask[] => {
  if (!tasks || tasks.length === 0) return [];

  const now = new Date();
  const result: OptimalTask[] = [];

  // Filter tasks with startTime and sort by startTime
  const sortedTasks = tasks
    .filter((t) => t?.startTime)
    .sort((a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0));

  if (sortedTasks.length === 0) return [];

  // Add the first task
  if (sortedTasks.length > 0) {
    result.push(sortedTasks[0]);
  }

  // Process gaps between tasks
  for (let i = 0; i < sortedTasks.length - 1; i++) {
    const currentTask = sortedTasks[i];
    const nextTask = sortedTasks[i + 1];

    if (!currentTask.startTime || !nextTask.startTime) {
      if (nextTask) result.push(nextTask);
      continue;
    }

    const currentTaskEnd = addMilliseconds(currentTask.startTime, currentTask.duration || 0);
    const gapDuration = differenceInMilliseconds(nextTask.startTime, currentTaskEnd);

    // Only create gaps if there's meaningful time between tasks (at least 15 mins)
    if (gapDuration >= FIFTEEN_MINUTES_IN_MS) {
      // Determine gap position type
      let gapPositionType: GapType;

      if (nextTask.startTime < now) {
        // Gap is completely in the past
        gapPositionType = 'past';
      } else if (currentTaskEnd > now) {
        // Gap is completely in the future
        gapPositionType = 'future';
      } else {
        // Current time is within the gap
        gapPositionType = 'active';
      }

      // Create the gap item
      const gapId = `gap-${currentTask.id}-${nextTask.id}-${gapPositionType}`;

      const gapItem: OptimalTask = {
        id: gapId,
        title: `Gap - ${gapPositionType}`,
        startTime: currentTaskEnd,
        nextStartTime: nextTask.startTime,
        duration: gapDuration,
        completed: false,
        isFocused: false,
        taskDate: currentTask.taskDate,
        time: `${format(currentTaskEnd, 'HH:mm')}—${format(nextTask.startTime, 'HH:mm')}`,
        priority: 'none',
        category: currentTask.category || 'work',
        isGap: true,
        gapType: gapPositionType,
        gapStartTime: currentTaskEnd,
        gapEndTime: nextTask.startTime,
        subtasks: [],
        progress: 0,
        timeSpent: 0,
        // Check if there's a break in this gap (break after task)
        break:
          currentTask.break?.type === 'after'
            ? {
                ...currentTask.break,
                startTime: currentTask.break.startTime
                  ? new Date(currentTask.break.startTime)
                  : undefined,
              }
            : undefined,
      };

      result.push(gapItem);
    }

    // Handle breaks during tasks
    if (nextTask.break?.type === 'during') {
      // Clone the task and add the break information
      const taskWithBreak = { ...nextTask };
      result.push(taskWithBreak);
    } else {
      result.push(nextTask);
    }
  }

  // Add end-of-day gap if needed
  const lastTask = sortedTasks[sortedTasks.length - 1];
  if (lastTask && lastTask.startTime && lastTask.duration) {
    const lastTaskEnd = addMilliseconds(lastTask.startTime, lastTask.duration);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const remainingTime = differenceInMilliseconds(endOfDay, lastTaskEnd);

    if (remainingTime >= FIFTEEN_MINUTES_IN_MS) {
      // Determine position type for end gap
      const gapPositionType: GapType =
        lastTaskEnd < now ? (now < endOfDay ? 'active' : 'past') : 'future';

      const gapId = `gap-${lastTask.id}-end-${gapPositionType}`;

      const endGap: OptimalTask = {
        id: gapId,
        title: `Gap - ${gapPositionType}`,
        startTime: lastTaskEnd,
        nextStartTime: endOfDay,
        duration: remainingTime,
        completed: false,
        isFocused: false,
        taskDate: lastTask.taskDate,
        time: `${format(lastTaskEnd, 'HH:mm')}—${format(endOfDay, 'HH:mm')}`,
        priority: 'none',
        category: lastTask.category || 'work',
        isGap: true,
        gapType: gapPositionType as any, // Type conversion needed until GapType is updated
        gapStartTime: lastTaskEnd,
        gapEndTime: endOfDay,
        subtasks: [],
        progress: 0,
        timeSpent: 0,
        // Check if there's a break after the last task
        break:
          lastTask.break?.type === 'after'
            ? {
                ...lastTask.break,
                startTime: lastTask.break.startTime
                  ? new Date(lastTask.break.startTime)
                  : undefined,
              }
            : undefined,
      };

      result.push(endGap);
    }
  }

  return result;
};
