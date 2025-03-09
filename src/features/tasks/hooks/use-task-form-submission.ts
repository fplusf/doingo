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
        // Include subtasks in updated values
        subtasks: formValues.subtasks || task.subtasks || [],
      };

      // Calculate progress if subtasks are present
      if (updatedValues.subtasks && updatedValues.subtasks.length > 0) {
        const completedCount = updatedValues.subtasks.filter((s) => s.isCompleted).length;
        updatedValues.progress = Math.round((completedCount / updatedValues.subtasks.length) * 100);
      } else {
        updatedValues.progress = formValues.progress || task.progress || 0;
      }

      const baseDate = new Date();
      let startDate: Date, durationMs: number;

      try {
        // Handle start date & time properly
        if (formValues.startTime) {
          const startDateRef = formValues.dueDate || task.dueDate || baseDate;
          startDate = parse(formValues.startTime, 'HH:mm', startDateRef);
          if (!isValid(startDate)) {
            startDate = baseDate;
          }
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
        const timeString = formValues.startTime
          ? formValues.startTime + (updatedValues.dueTime ? `—${updatedValues.dueTime}` : '')
          : (task.time || format(startDate, 'HH:mm')) +
            (updatedValues.dueTime ? `—${updatedValues.dueTime}` : '');

        return {
          ...task,
          ...updatedValues,
          time: timeString,
          startTime: startDate,
          nextStartTime,
          duration: durationMs,
          taskDate: task.taskDate, // Ensure taskDate is preserved
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
          taskDate: task.taskDate, // Ensure taskDate is preserved
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

        // Ensure all task properties are preserved
        const finalTask: OptimalTask = {
          ...task, // Preserve all existing task properties
          ...updatedTask, // Apply updates from form values
          taskDate: task.taskDate, // Ensure taskDate is preserved
        };

        // Ensure subtasks are properly included
        if (formValues.subtasks) {
          finalTask.subtasks = formValues.subtasks;

          // Calculate progress based on subtasks
          if (finalTask.subtasks.length > 0) {
            const completedCount = finalTask.subtasks.filter((s) => s.isCompleted).length;
            finalTask.progress = Math.round((completedCount / finalTask.subtasks.length) * 100);
          }
        }

        updateTask(task.id, finalTask);
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

        const taskId = uuidv4();
        const task: OptimalTask = {
          id: taskId,
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
          // Use subtasks from form values instead of empty array
          subtasks: formValues.subtasks || [],
          // Use progress from form values or calculate it
          progress:
            formValues.progress ||
            (formValues.subtasks && formValues.subtasks.length > 0
              ? Math.round(
                  (formValues.subtasks.filter((s) => s.isCompleted).length /
                    formValues.subtasks.length) *
                    100,
                )
              : 0),
        };

        addTask(task);
        return taskId; // Return the task ID for navigation
      } catch (error) {
        console.error('Error creating task:', error);
        return null;
      }
    } catch (error) {
      console.error('Failed to create new task:', error);
      return null;
    }
  };

  return {
    createNewTask,
    editTask,
    getDefaultStartTime,
    getDefaultEndTime,
  };
};
