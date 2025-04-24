import { addDays, addMonths, addWeeks, isBefore } from 'date-fns';
import { OptimalTask } from '../types/task.types';

export function generateRepeatedTasks(task: OptimalTask, dueDate: Date): OptimalTask[] {
  const repeatedTasks: OptimalTask[] = [];

  if (!task.startTime || task.repetition?.type === 'once') {
    return [task];
  }

  let currentDate = new Date(task.startTime);
  const endDate = new Date(dueDate);

  while (isBefore(currentDate, endDate)) {
    // Create a new task instance for this date
    const repeatedTask: OptimalTask = {
      ...task,
      id: crypto.randomUUID(), // Generate new ID for each instance
      startTime: new Date(currentDate),
      taskDate: currentDate.toISOString().split('T')[0],
      isPartOfMultiDay: true,
      originalTaskId: task.id,
      multiDaySetId: task.id, // Use original task ID as the set ID
    };

    repeatedTasks.push(repeatedTask);

    // Calculate next date based on repetition type
    switch (task.repetition?.type) {
      case 'daily':
        currentDate = addDays(currentDate, task.repetition?.repeatInterval || 1);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, task.repetition?.repeatInterval || 1);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, task.repetition?.repeatInterval || 1);
        break;
      default:
        currentDate = addDays(currentDate, 1);
    }
  }

  // Mark first and last tasks in the set
  if (repeatedTasks.length > 0) {
    repeatedTasks[0].isFirstDayOfSet = true;
    repeatedTasks[repeatedTasks.length - 1].isLastDayOfSet = true;
  }

  return repeatedTasks;
}
