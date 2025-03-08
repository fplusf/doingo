import { addTask, updateTask } from '@/features/tasks/store/tasks.store';
import { ONE_HOUR_IN_MS, OptimalTask, TaskCategory } from '@/features/tasks/types';
import { getNextFifteenMinuteInterval } from '@/shared/helpers/date/next-feefteen-minutes';
import { addMilliseconds, format, isValid, parse, parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { TaskFormValues } from '../components/schedule';

export const useTaskFormSubmission = (selectedDate: string) => {
  // Helper function to get default time values
  const getDefaultStartTime = () => {
    const nextFifteen = getNextFifteenMinuteInterval();
    return format(nextFifteen, 'HH:mm');
  };

  const getDefaultEndTime = () => {
    const nextFifteen = getNextFifteenMinuteInterval();
    return format(addMilliseconds(nextFifteen, ONE_HOUR_IN_MS), 'HH:mm');
  };

  const convertFormValuesToTask = (task: OptimalTask, formValues: TaskFormValues) => {
    try {
      // Extract values from form or use existing task values
      const updatedValues: Partial<OptimalTask> = {
        title: formValues.title || task.title,
        notes: formValues.notes || task.notes,
        emoji: formValues.emoji || task.emoji,
        priority: formValues.priority || task.priority,
        category: formValues.category || task.category,
      };

      const baseDate = new Date();
      let startDate: Date, durationMs: number;

      try {
        // Handle start date & time properly
        if (formValues.startTime) {
          const startDateRef = formValues.dueDate || task.dueDate || baseDate;
          startDate = parse(formValues.startTime, 'HH:mm', startDateRef);
        } else if (task.startTime && isValid(task.startTime)) {
          startDate = task.startTime;
        } else {
          startDate = parseISO(task.taskDate);
        }

        // Handle due date & time independently - only set if explicitly provided
        if (formValues.dueTime !== undefined) {
          updatedValues.dueTime = formValues.dueTime || undefined;
        } else if (task.dueTime) {
          updatedValues.dueTime = task.dueTime;
        }

        if (formValues.dueDate !== undefined) {
          updatedValues.dueDate = formValues.dueDate || undefined;
        }

        // Handle duration independently
        if (formValues.duration && formValues.duration > 0) {
          durationMs = formValues.duration;
        } else if (task.duration > 0) {
          durationMs = task.duration;
        } else {
          durationMs = ONE_HOUR_IN_MS;
        }

        // Calculate nextStartTime based on duration
        const nextStartTime = addMilliseconds(startDate, durationMs);

        // Ensure we have a valid time string - only include due time if it exists
        const timeString =
          (formValues.startTime || format(startDate, 'HH:mm')) +
          (updatedValues.dueTime || task.dueTime
            ? `—${updatedValues.dueTime || task.dueTime}`
            : '');

        return {
          ...task,
          ...updatedValues,
          time: timeString,
          startTime: startDate,
          nextStartTime,
          duration: durationMs,
        };
      } catch (error) {
        console.error('Error parsing dates:', error);
        startDate = parseISO(task.taskDate);
        durationMs = task.duration > 0 ? task.duration : ONE_HOUR_IN_MS;
        const nextStartTime = addMilliseconds(startDate, durationMs);
        return {
          ...task,
          ...updatedValues,
          startTime: startDate,
          nextStartTime,
          duration: durationMs,
        };
      }
    } catch (error) {
      console.error('Failed to convert form values to task:', error);
      return task;
    }
  };

  // Use the conversion function to update the task
  const editTask = (task: OptimalTask, formValues: TaskFormValues) => {
    if (task) {
      try {
        const updatedTask = convertFormValuesToTask(task, formValues);

        updateTask(task.id, updatedTask);
      } catch (error) {
        console.error('Failed to edit task:', error);
      }
    }
  };

  const createNewTask = (formValues: TaskFormValues, category: TaskCategory = 'work') => {
    try {
      const baseDate = parseISO(selectedDate);
      let startDate: Date, durationMs: number;

      try {
        // Handle start date & time properly
        if (formValues.startTime) {
          const startDateRef = formValues.dueDate || baseDate;
          startDate = parse(formValues.startTime, 'HH:mm', startDateRef);
        } else {
          startDate = getNextFifteenMinuteInterval();
        }

        // Handle duration independently
        if (formValues.duration && formValues.duration > 0) {
          durationMs = formValues.duration;
        } else {
          durationMs = ONE_HOUR_IN_MS;
        }

        if (!isValid(startDate)) startDate = baseDate;

        // Calculate nextStartTime based on duration
        const nextStartTime = addMilliseconds(startDate, durationMs);

        // Ensure we have a valid time string - only include due time if explicitly set
        const timeString =
          formValues.startTime && formValues.dueTime
            ? `${formValues.startTime}—${formValues.dueTime}`
            : `${format(startDate, 'HH:mm')}${formValues.dueTime ? `—${formValues.dueTime}` : ''}`;

        const task: OptimalTask = {
          id: uuidv4(),
          title: formValues.title,
          notes: formValues.notes || '',
          emoji: formValues.emoji || '',
          time: timeString,
          startTime: startDate,
          nextStartTime,
          duration: durationMs,
          // Only set dueDate and dueTime if explicitly provided
          dueDate: formValues.dueDate,
          dueTime: formValues.dueTime,
          priority: formValues.priority || 'none',
          category: formValues.category || category,
          completed: false,
          isFocused: false,
          taskDate: selectedDate,
          subtasks: [],
          progress: 0,
        };

        addTask(task);
      } catch (error) {
        console.error('Error creating task:', error);
      }
    } catch (error) {
      console.error('Failed to create new task:', error);
    }
  };

  return {
    createNewTask,
    editTask,
    getDefaultStartTime,
    getDefaultEndTime,
  };
};
