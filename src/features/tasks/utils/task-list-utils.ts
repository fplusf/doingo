import { addMilliseconds, differenceInMilliseconds, format } from 'date-fns';
import { GapType } from '../types'; // Assuming GapType is also in types
import {
  FIFTEEN_MINUTES_IN_MS,
  ONE_HOUR_IN_MS,
  OptimalTask,
  TWENTY_MINUTES_IN_MS,
} from '../types/task.types';

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
  if (!tasks || tasks.length === 0) return []; // Handle empty or null input

  const now = new Date();
  const result: OptimalTask[] = [];
  const sortedTasks = sortByStartTime(tasks.filter((t) => t?.startTime)); // Filter tasks without startTime

  if (sortedTasks.length === 0) return []; // Return empty if no valid tasks

  // Get end of day (23:59:59)
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // Add the first task if it exists
  if (sortedTasks.length > 0) {
    result.push(sortedTasks[0]);
  }

  for (let i = 0; i < sortedTasks.length - 1; i++) {
    const currentTask = sortedTasks[i];
    const nextTask = sortedTasks[i + 1];

    // Ensure startTimes exist
    if (!currentTask.startTime || !nextTask.startTime) {
      // If next task exists but current one lacks startTime, still add next task
      if (nextTask) result.push(nextTask);
      continue;
    }

    const currentTaskEnd = addMilliseconds(currentTask.startTime, currentTask.duration || 0);
    const gapDuration = differenceInMilliseconds(nextTask.startTime, currentTaskEnd);

    const isCurrentTaskEndInPast = currentTaskEnd < now;
    const isNextTaskStartInPast = nextTask.startTime < now;
    // const isNextTaskStartInFuture = nextTask.startTime > now; // Not directly used, removed for simplicity
    const isPastGap = isCurrentTaskEndInPast && isNextTaskStartInPast;
    const isFutureGap = !isCurrentTaskEndInPast && !isNextTaskStartInPast; // Correct: Both must be in future (or now)
    const hasFreeSlot = gapDuration >= FIFTEEN_MINUTES_IN_MS && gapDuration > 0;
    const hasSmallGap = gapDuration > 0 && gapDuration < FIFTEEN_MINUTES_IN_MS;
    const isBreakGap = isPastGap && gapDuration > TWENTY_MINUTES_IN_MS; // Logic seems specific, keeping as is

    // Don't add gaps if the current task ends after 23:59
    if (hasFreeSlot && currentTaskEnd <= endOfDay) {
      let gapType: GapType = 'free-slot';
      // Refined gap logic based on common scenarios
      if (isPastGap) {
        // Both the gap start and end are in the past
        gapType = 'idle-time'; // Gap is entirely in the past
        if (isBreakGap) {
          // If it's a past gap AND long enough, might still classify as break if needed
          // For now, let's keep it simple: past gaps are idle time
          gapType = 'idle-time';
        }
      } else if (hasSmallGap && isFutureGap) {
        gapType = 'get-ready'; // Small gap between future tasks
      } else if (isFutureGap && gapDuration >= FIFTEEN_MINUTES_IN_MS) {
        gapType = 'free-slot'; // Larger gap between future tasks
      } else if (!isPastGap && !isFutureGap) {
        // Gap spans across 'now' OR start is in past but end is in future
        // Only consider it 'idle-time' if BOTH the gap's start AND end are in the past
        const isGapCurrentlyActive = isCurrentTaskEndInPast && !isNextTaskStartInPast;

        if (isGapCurrentlyActive) {
          // Gap started in past but hasn't ended yet
          gapType = 'free-slot';
        } else {
          // Could be 'break' if current task is ending and next is starting soon,
          // or 'free-slot' if it's a larger gap starting now/recently
          gapType = gapDuration > TWENTY_MINUTES_IN_MS ? 'break' : 'free-slot';
        }
      }

      // Create a deterministic gap ID based on surrounding tasks and gap type
      const gapId = `gap-${currentTask.id}-${nextTask.id}-${gapType}`;
      // const gapEndTime = new Date(currentTaskEnd.getTime() + gapDuration); // This is just nextTask.startTime
      const gapItem: OptimalTask = {
        id: gapId,
        title: `Gap - ${gapType}`,
        startTime: currentTaskEnd, // Gap starts when current task ends
        nextStartTime: nextTask.startTime, // Gap ends when next task starts
        duration: gapDuration,
        completed: false, // Gaps are never completed
        isFocused: false, // Gaps are never focused
        taskDate: currentTask.taskDate, // Use date of the task before the gap
        time: `${format(currentTaskEnd, 'HH:mm')}—${format(nextTask.startTime, 'HH:mm')}`,
        priority: 'none',
        category: currentTask.category || 'work', // Inherit category
        isGap: true,
        gapType: gapType,
        gapStartTime: currentTaskEnd, // Explicit start time for clarity
        gapEndTime: nextTask.startTime, // Explicit end time for clarity
        subtasks: [],
        progress: 0,
        timeSpent: 0,
      };
      result.push(gapItem);
    }
    result.push(nextTask); // Add the next task after processing the gap (or lack thereof)
  }

  // Add free slot gap at the end of the day if there's significant time left
  const lastTask = sortedTasks[sortedTasks.length - 1];
  if (lastTask && lastTask.startTime && lastTask.duration) {
    const lastTaskEnd = addMilliseconds(lastTask.startTime, lastTask.duration);

    // Only show end of day gap if last task ends before 23:59
    if (lastTaskEnd <= endOfDay) {
      const remainingTime = differenceInMilliseconds(endOfDay, lastTaskEnd);

      if (remainingTime > ONE_HOUR_IN_MS) {
        // No need for 'now' here, gap type depends on when the last task ended
        const gapType: GapType = lastTaskEnd < new Date() ? 'idle-time' : 'free-slot';
        const gapId = `gap-${lastTask.id}-end-${gapType}`;
        const endGap: OptimalTask = {
          id: gapId,
          title: `Gap - ${gapType}`,
          startTime: lastTaskEnd,
          nextStartTime: endOfDay, // End of day
          duration: remainingTime,
          completed: false,
          isFocused: false,
          taskDate: lastTask.taskDate,
          time: `${format(lastTaskEnd, 'HH:mm')}—${format(endOfDay, 'HH:mm')}`,
          priority: 'none',
          category: lastTask.category || 'work',
          isGap: true,
          gapType: gapType,
          gapStartTime: lastTaskEnd,
          gapEndTime: endOfDay,
          subtasks: [],
          progress: 0,
          timeSpent: 0,
        };
        result.push(endGap);
      }
    }
  } else if (sortedTasks.length === 0 && tasks.length > 0) {
    // Handle case where original tasks exist but none have startTime - return original tasks? Or empty?
    // Current behavior returns [], which might be okay. If needed, could return `tasks` here.
  } else if (sortedTasks.length === 0 && tasks.length === 0) {
    // Input was empty, result is already []
  }

  return result;
};
