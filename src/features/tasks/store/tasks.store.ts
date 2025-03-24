import {
  findNextAvailableTimeSlot,
  getNextFifteenMinuteInterval,
} from '@/shared/helpers/date/next-feefteen-minutes';
import { LocalStorageAdapter } from '@/shared/store/adapters/local-storage-adapter';
import { StorageAdapter } from '@/shared/store/adapters/storage-adapter';
import { Store } from '@tanstack/react-store';
import { addMilliseconds, format, parse, parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import {
  ONE_HOUR_IN_MS,
  OptimalTask,
  RepetitionOption,
  Subtask,
  TaskCategory,
  TaskPriority,
  TasksState,
} from '../types/task.types';

// Initialize the storage adapter (can be easily swapped with a different implementation)
const storageAdapter: StorageAdapter = new LocalStorageAdapter();

// Get today's date as a string in YYYY-MM-DD format
const today = format(new Date(), 'yyyy-MM-dd');

// Initialize store with tasks from storage
const initialState: TasksState = {
  tasks: storageAdapter.getTasks().map((task: OptimalTask) => ({
    ...task,
    taskDate: task.taskDate || today,
  })),
  selectedDate: today,
  focusedTaskId: null,
  editingTaskId: null,
  highlightedTaskId: null,
};

export const tasksStore = new Store<TasksState>(initialState);

// Helper function to update state and storage
const updateStateAndStorage = (updater: (state: TasksState) => TasksState) => {
  const newState = updater(tasksStore.state);
  tasksStore.setState(() => newState);
  storageAdapter.saveTasks(newState.tasks);
};

export const setSelectedDate = (date: string) => {
  tasksStore.setState((state) => ({
    ...state,
    selectedDate: date,
  }));
};

export const getTasksByDate = (date: string) => {
  return tasksStore.state.tasks.filter((task: OptimalTask) => task.taskDate === date);
};

export const addTask = (task: Omit<OptimalTask, 'id'>) => {
  // Set the taskDate to the selectedDate if not provided
  const taskDate = task.taskDate || tasksStore.state.selectedDate;

  updateStateAndStorage((state) => ({
    ...state,
    tasks: [
      ...state.tasks,
      {
        ...task,
        id: uuidv4(),
        priority: task.priority || 'none',
        taskDate,
        subtasks: task.subtasks || [],
        progress: task.progress || 0,
      },
    ],
  }));
};

export const updateTask = (id: string, updates: Partial<OptimalTask>) => {
  updateStateAndStorage((state) => {
    const task = state.tasks.find((t: OptimalTask) => t.id === id);
    if (!task) return state;

    // If time is being updated, extract the date from the start time
    if (updates.time && typeof updates.time === 'string') {
      try {
        const timeComponents = updates.time.split(/[—-]/); // Handle both em dash and regular dash
        if (timeComponents.length > 0) {
          const startTime = timeComponents[0].trim();
          const [hours, minutes] = startTime.split(':').map(Number);

          if (!isNaN(hours) && !isNaN(minutes)) {
            // Create date from the current task date and new time
            const currentDate = new Date(task.taskDate + 'T00:00:00');
            currentDate.setHours(hours, minutes);

            // Update taskDate to match the start time's date
            updates.taskDate = format(currentDate, 'yyyy-MM-dd');
          }
        }
      } catch (error) {
        console.error('Error parsing time:', error);
      }
    }

    return {
      ...state,
      tasks: state.tasks.map((task: OptimalTask) =>
        task.id === id ? { ...task, ...updates } : task,
      ),
    };
  });
};

export const deleteTask = (id: string) => {
  // remove the canvas data from local storage
  if (id) {
    localStorage.removeItem(`canvas_${id}`);
  }

  updateStateAndStorage((state) => ({
    ...state,
    tasks: state.tasks.filter((task: OptimalTask) => task.id !== id),
  }));
};

export const setFocusedTaskId = (taskId: string | null) => {
  tasksStore.setState((state) => ({
    ...state,
    focusedTaskId: taskId,
  }));
};

export const setEditingTaskId = (taskId: string | null) => {
  tasksStore.setState((state) => ({
    ...state,
    editingTaskId: taskId,
  }));
};

export const setFocused = (id: string, isFocused: boolean) => {
  const today = format(new Date(), 'yyyy-MM-dd');

  updateStateAndStorage((state) => {
    // Find the task that should be focused
    const taskToFocus = state.tasks.find((task: OptimalTask) => task.id === id);

    // If the task is not for today, don't allow focusing
    if (taskToFocus && taskToFocus.taskDate !== today && isFocused) {
      return state;
    }

    return {
      ...state,
      focusedTaskId: isFocused ? id : null,
      tasks: state.tasks.map((task: OptimalTask) => {
        if (task.id === id) {
          return { ...task, isFocused };
        }
        // Ensure other tasks are unfocused
        return { ...task, isFocused: false };
      }),
    };
  });
};

export const toggleTaskCompletion = (id: string) => {
  // Simply toggle the completion status without reordering
  updateStateAndStorage((state) => ({
    ...state,
    tasks: state.tasks.map((task: OptimalTask) => {
      if (task.id === id) {
        return {
          ...task,
          completed: !task.completed,
          isFocused: false, // Still remove focus when toggling completion
        };
      }
      return task;
    }),
  }));
};

export const clearTasks = () => {
  storageAdapter.clear();
  tasksStore.setState(() => ({
    tasks: [],
    selectedDate: today,
    focusedTaskId: null,
    editingTaskId: null,
    highlightedTaskId: null,
  }));
};

// Scheduling-specific functions
export const updateTaskRepetition = (taskId: string, repetition: RepetitionOption) => {
  updateStateAndStorage((state) => {
    const task = state.tasks.find((t: OptimalTask) => t.id === taskId);
    if (!task) return state;

    return {
      ...state,
      tasks: state.tasks.map((t: OptimalTask) => (t.id === taskId ? { ...t, repetition } : t)),
    };
  });
};

export const updateTaskStartDateTime = (taskId: string, date: Date, time: string) => {
  updateStateAndStorage((state) => {
    const task = state.tasks.find((t: OptimalTask) => t.id === taskId);
    if (!task) return state;

    // Format taskDate from the provided date
    const taskDate = format(date, 'yyyy-MM-dd');

    // Parse the start time
    const startTime = parse(time, 'HH:mm', date);

    // Update time string - preserve due time if it exists
    let timeString = time;
    if (task.time && task.time.includes('—')) {
      const timeParts = task.time.split('—');
      if (timeParts.length > 1) {
        timeString = `${time}—${timeParts[1]}`;
      }
    }

    // Calculate next start time based on current duration
    const nextStartTime = addMilliseconds(startTime, task.duration || 0);

    return {
      ...state,
      tasks: state.tasks.map((t: OptimalTask) =>
        t.id === taskId
          ? {
              ...t,
              taskDate,
              startTime,
              nextStartTime,
              time: timeString,
            }
          : t,
      ),
    };
  });
};

export const updateTaskDueDateTime = (taskId: string, date: Date, time: string) => {
  updateStateAndStorage((state) => {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return state;

    // Update time string - preserve start time
    let timeString = task.time || '';
    if (timeString.includes('—')) {
      const timeParts = timeString.split('—');
      timeString = `${timeParts[0]}—${time}`;
    } else if (timeString) {
      timeString = `${timeString}—${time}`;
    } else {
      // If no time string exists yet, just set the due time
      timeString = `—${time}`;
    }

    return {
      ...state,
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              dueDate: date,
              dueTime: time,
              time: timeString,
            }
          : t,
      ),
    };
  });
};

export const updateTaskDuration = (taskId: string, durationMs: number) => {
  updateStateAndStorage((state) => {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return state;

    // Calculate the new next start time based on the start time and new duration
    const nextStartTime = task.startTime ? addMilliseconds(task.startTime, durationMs) : new Date();

    return {
      ...state,
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              duration: durationMs,
              nextStartTime,
            }
          : t,
      ),
    };
  });
};

// Function to get task's current category and priority
export const getTaskCategoryAndPriority = (taskId: string) => {
  const task = tasksStore.state.tasks.find((t: OptimalTask) => t.id === taskId);
  if (!task) return { category: 'work' as TaskCategory, priority: 'medium' as TaskPriority };

  return {
    category: task.category || 'work',
    priority: task.priority || 'medium',
  };
};

// Helper functions for time management
export const getDefaultStartTime = () => {
  const selectedDate = tasksStore.state.selectedDate;
  const tasksOnDate = getTasksByDate(selectedDate);

  if (tasksOnDate.length === 0) {
    // For the first task of the day, use the next 15-minute interval
    return format(getNextFifteenMinuteInterval(), 'HH:mm');
  } else {
    // For subsequent tasks, use the time after the end of the last task
    return findNextAvailableTimeSlot(selectedDate);
  }
};

export const getDefaultEndTime = () => {
  const startTime = getDefaultStartTime();
  const [hours, minutes] = startTime.split(':').map(Number);

  // Create a Date object for the start time
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);

  // Add one hour to get the end time
  return format(addMilliseconds(startDate, ONE_HOUR_IN_MS), 'HH:mm');
};

// Enhanced task creation function
export const createNewTask = (
  values: {
    title: string;
    notes?: string;
    emoji?: string;
    startTime?: string;
    dueTime?: string;
    duration?: number;
    dueDate?: Date;
    priority?: TaskPriority;
    category?: TaskCategory;
    subtasks?: any[];
    progress?: number;
    repetition?: RepetitionOption;
  },
  category: TaskCategory = 'work',
) => {
  try {
    // Handle start time and date
    let taskDate = tasksStore.state.selectedDate;
    let timeString = '';
    let startTime: Date;

    if (values.startTime) {
      timeString = values.startTime;
      startTime = parse(values.startTime, 'HH:mm', parseISO(taskDate));

      // If there's a due time, append it
      if (values.dueTime) {
        timeString += `—${values.dueTime}`;
      }

      // If there's a due date, use it as the task date
      if (values.dueDate) {
        taskDate = format(values.dueDate, 'yyyy-MM-dd');
        startTime = parse(values.startTime, 'HH:mm', values.dueDate);
      }
    } else {
      // Use default time if none provided
      startTime = getNextFifteenMinuteInterval();
      timeString = format(startTime, 'HH:mm');
    }

    // Handle duration
    const duration = values.duration && values.duration > 0 ? values.duration : ONE_HOUR_IN_MS;

    // Calculate next start time
    const nextStartTime = addMilliseconds(startTime, duration);

    const taskId = uuidv4();
    const task: OptimalTask = {
      id: taskId,
      title: values.title,
      notes: values.notes || '',
      emoji: values.emoji || '',
      time: timeString,
      duration,
      dueDate: values.dueDate,
      dueTime: values.dueTime,
      priority: values.priority || 'none',
      category: values.category || category,
      completed: false,
      isFocused: false,
      taskDate,
      subtasks: values.subtasks || [],
      progress: values.progress || 0,
      startTime,
      nextStartTime,
      repetition: values.repetition || 'once',
    };

    addTask(task);
    return taskId;
  } catch (error) {
    console.error('Failed to create new task:', error);
    return null;
  }
};

// Enhanced task editing function
export const editExistingTask = (
  task: OptimalTask,
  values: {
    title: string;
    notes?: string;
    emoji?: string;
    startTime?: string;
    dueTime?: string;
    duration?: number;
    dueDate?: Date;
    priority?: TaskPriority;
    category?: TaskCategory;
    subtasks?: Subtask[];
    progress?: number;
    repetition?: RepetitionOption;
  },
) => {
  try {
    // Extract values from form or use existing task values
    const updatedValues: Partial<OptimalTask> = {
      title: values.title || task.title,
      notes: values.notes || task.notes,
      emoji: values.emoji || task.emoji,
      priority: values.priority || task.priority,
      category: values.category || task.category,
      subtasks: values.subtasks || task.subtasks || [],
    };

    // Calculate progress if subtasks are present
    if (updatedValues.subtasks && updatedValues.subtasks.length > 0) {
      const completedCount = updatedValues.subtasks.filter((s: Subtask) => s.isCompleted).length;
      updatedValues.progress = Math.round((completedCount / updatedValues.subtasks.length) * 100);
    } else {
      updatedValues.progress = values.progress || task.progress || 0;
    }

    try {
      // Handle start time and date
      let taskDate = task.taskDate;
      let timeString = task.time || '';
      let startTime = new Date(task.taskDate);

      if (values.startTime) {
        timeString = values.startTime;
        startTime = parse(values.startTime, 'HH:mm', parseISO(taskDate));

        // If there's a due time, append it
        if (values.dueTime) {
          timeString += `—${values.dueTime}`;
        }

        // If there's a due date, use it as the task date
        if (values.dueDate) {
          taskDate = format(values.dueDate, 'yyyy-MM-dd');
          startTime = parse(values.startTime, 'HH:mm', values.dueDate);
        }
      }

      // Handle duration
      const duration =
        values.duration && values.duration > 0 ? values.duration : task.duration || ONE_HOUR_IN_MS;

      // Calculate next start time
      const nextStartTime = addMilliseconds(startTime, duration);

      const finalUpdatedValues = {
        ...updatedValues,
        time: timeString,
        duration,
        taskDate,
        dueDate: values.dueDate,
        dueTime: values.dueTime,
        startTime,
        nextStartTime,
        repetition: values.repetition || task.repetition || 'once',
      };

      updateTask(task.id, finalUpdatedValues);
    } catch (error) {
      console.error('Error parsing dates:', error);
      updateTask(task.id, updatedValues);
    }
  } catch (error) {
    console.error('Failed to edit task:', error);
  }
};

export const setHighlightedTaskId = (taskId: string | null) => {
  tasksStore.setState((state) => ({
    ...state,
    highlightedTaskId: taskId,
  }));
};

// Helper function to trigger highlight animation
export const highlightTask = (taskId: string) => {
  // First blink
  setHighlightedTaskId(taskId);

  setTimeout(() => {
    setHighlightedTaskId(null);

    // Brief pause
    setTimeout(() => {
      // Second blink
      setHighlightedTaskId(taskId);

      // End animation
      setTimeout(() => {
        setHighlightedTaskId(null);
      }, 500);
    }, 300);
  }, 500);
};

// Push forward affected tasks after a task's duration changes
export const pushForwardAffectedTasks = (
  taskId: string,
  startTime: string,
  duration: number,
  date: Date,
) => {
  const taskDate = format(date, 'yyyy-MM-dd');

  // Get tasks on the selected date
  const tasksOnDate = tasksStore.state.tasks.filter(
    (task) => task.taskDate === taskDate && task.id !== taskId,
  );

  if (tasksOnDate.length === 0) return;

  // Parse the current task's time range
  const [hours, minutes] = startTime.split(':').map(Number);
  const startTimeInMinutes = hours * 60 + minutes;
  const endTimeInMinutes = startTimeInMinutes + duration / (60 * 1000);

  // Identify affected tasks (those that start during or after this task)
  const affectedTasks = tasksOnDate.filter((task) => {
    if (!task.time) return false;

    const [taskStartTime] = task.time.split('—');
    const [taskHours, taskMinutes] = taskStartTime.split(':').map(Number);
    const taskStartInMinutes = taskHours * 60 + taskMinutes;

    // Task is affected if it starts during or after this task's range
    return taskStartInMinutes >= startTimeInMinutes && taskStartInMinutes < endTimeInMinutes;
  });

  if (affectedTasks.length === 0) return;

  // Sort tasks by start time to maintain order
  const sortedTasks = [...affectedTasks].sort((a, b) => {
    if (!a.time || !b.time) return 0;

    const [aStartTime] = a.time.split('—');
    const [bStartTime] = b.time.split('—');

    const [aHours, aMinutes] = aStartTime.split(':').map(Number);
    const [bHours, bMinutes] = bStartTime.split(':').map(Number);

    const aStartInMinutes = aHours * 60 + aMinutes;
    const bStartInMinutes = bHours * 60 + bMinutes;

    return aStartInMinutes - bStartInMinutes;
  });

  // Calculate the new start time for the first affected task
  // Convert end time back to hours and minutes
  const newStartHour = Math.floor(endTimeInMinutes / 60);
  const newStartMinute = endTimeInMinutes % 60;

  // Round to the nearest 15-minute interval
  const roundedMinutes = Math.ceil(newStartMinute / 15) * 15;
  let adjustedHour = newStartHour;
  let adjustedMinute = roundedMinutes;

  // If rounded to 60 minutes, add an hour and set minutes to 0
  if (roundedMinutes === 60) {
    adjustedHour += 1;
    adjustedMinute = 0;
  }

  // Format the new start time
  const newStartTime = `${adjustedHour.toString().padStart(2, '0')}:${adjustedMinute.toString().padStart(2, '0')}`;

  // Create a date object for the adjusted start time
  const adjustedStartDate = new Date(date);
  adjustedStartDate.setHours(adjustedHour, adjustedMinute, 0, 0);

  // Update the first affected task
  if (sortedTasks.length > 0) {
    const firstTask = sortedTasks[0];
    updateTaskStartDateTime(firstTask.id, adjustedStartDate, newStartTime);

    // Update remaining tasks in sequence
    let previousEndTime = addMilliseconds(adjustedStartDate, firstTask.duration || ONE_HOUR_IN_MS);

    for (let i = 1; i < sortedTasks.length; i++) {
      const currentTask = sortedTasks[i];

      // Round to the nearest 15-minute interval
      const prevEndMinutes = previousEndTime.getMinutes();
      const roundedEndMinutes = Math.ceil(prevEndMinutes / 15) * 15;

      previousEndTime.setMinutes(roundedEndMinutes);
      previousEndTime.setSeconds(0);
      previousEndTime.setMilliseconds(0);

      // If rounded to 60 minutes, add an hour and set minutes to 0
      if (roundedEndMinutes === 60) {
        previousEndTime.setHours(previousEndTime.getHours() + 1);
        previousEndTime.setMinutes(0);
      }

      // Format the new start time for this task
      const taskStartTime = format(previousEndTime, 'HH:mm');

      // Update this task's start time
      updateTaskStartDateTime(currentTask.id, previousEndTime, taskStartTime);

      // Calculate the end time for the next task
      previousEndTime = addMilliseconds(previousEndTime, currentTask.duration || ONE_HOUR_IN_MS);
    }
  }
};
