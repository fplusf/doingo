import { addTask, updateTask } from '@/features/tasks/store/tasks.store';
import { ONE_HOUR_IN_MS, OptimalTask, TaskCategory } from '@/features/tasks/types';
import { getNextFifteenMinuteInterval } from '@/shared/helpers/date/next-feefteen-minutes';
import { addMilliseconds, format, parse, parseISO } from 'date-fns';
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
        subtasks: formValues.subtasks || task.subtasks || [],
      };

      // Calculate progress if subtasks are present
      if (updatedValues.subtasks && updatedValues.subtasks.length > 0) {
        const completedCount = updatedValues.subtasks.filter((s) => s.isCompleted).length;
        updatedValues.progress = Math.round((completedCount / updatedValues.subtasks.length) * 100);
      } else {
        updatedValues.progress = formValues.progress || task.progress || 0;
      }

      try {
        // Handle start time and date
        let taskDate = task.taskDate;
        let timeString = task.time || '';
        let startTime = task.startTime;

        if (formValues.startTime) {
          timeString = formValues.startTime;
          startTime = parse(formValues.startTime, 'HH:mm', parseISO(taskDate));

          // If there's a due time, append it
          if (formValues.dueTime) {
            timeString += `—${formValues.dueTime}`;
          }

          // If there's a due date, use it as the task date
          if (formValues.dueDate) {
            taskDate = format(formValues.dueDate, 'yyyy-MM-dd');
            startTime = parse(formValues.startTime, 'HH:mm', formValues.dueDate);
          }
        }

        // Handle duration
        const duration =
          formValues.duration && formValues.duration > 0
            ? formValues.duration
            : task.duration || ONE_HOUR_IN_MS;

        // Calculate next start time
        const nextStartTime = addMilliseconds(startTime, duration);

        return {
          ...task,
          ...updatedValues,
          time: timeString,
          duration,
          taskDate,
          dueDate: formValues.dueDate,
          dueTime: formValues.dueTime,
          startTime,
          nextStartTime,
        };
      } catch (error) {
        console.error('Error parsing dates:', error);
        return {
          ...task,
          ...updatedValues,
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
      // Handle start time and date
      let taskDate = selectedDate;
      let timeString = '';
      let startTime: Date;

      if (formValues.startTime) {
        timeString = formValues.startTime;
        startTime = parse(formValues.startTime, 'HH:mm', parseISO(taskDate));

        // If there's a due time, append it
        if (formValues.dueTime) {
          timeString += `—${formValues.dueTime}`;
        }

        // If there's a due date, use it as the task date
        if (formValues.dueDate) {
          taskDate = format(formValues.dueDate, 'yyyy-MM-dd');
          startTime = parse(formValues.startTime, 'HH:mm', formValues.dueDate);
        }
      } else {
        // Use default time if none provided
        startTime = getNextFifteenMinuteInterval();
        timeString = format(startTime, 'HH:mm');
      }

      // Handle duration
      const duration =
        formValues.duration && formValues.duration > 0 ? formValues.duration : ONE_HOUR_IN_MS;

      // Calculate next start time
      const nextStartTime = addMilliseconds(startTime, duration);

      const taskId = uuidv4();
      const task: OptimalTask = {
        id: taskId,
        title: formValues.title,
        notes: formValues.notes || '',
        emoji: formValues.emoji || '',
        time: timeString,
        duration,
        dueDate: formValues.dueDate,
        dueTime: formValues.dueTime,
        priority: formValues.priority || 'none',
        category: formValues.category || category,
        completed: false,
        isFocused: false,
        taskDate,
        subtasks: formValues.subtasks || [],
        progress: formValues.progress || 0,
        startTime,
        nextStartTime,
      };

      addTask(task);
      return taskId;
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
