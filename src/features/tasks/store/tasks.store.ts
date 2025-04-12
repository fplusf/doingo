import {
  findNextAvailableTimeSlot,
  getNextFifteenMinuteInterval,
  getNextFiveMinuteInterval,
} from '@/shared/helpers/date/next-feefteen-minutes';
import { LocalStorageAdapter } from '@/shared/store/adapters/local-storage-adapter';
import { StorageAdapter } from '@/shared/store/adapters/storage-adapter';
import { Store } from '@tanstack/react-store';
import {
  addDays,
  addMilliseconds,
  differenceInDays,
  differenceInMilliseconds,
  format,
  getHours,
  getMinutes,
  isSameDay,
  parse,
  parseISO,
  startOfDay,
} from 'date-fns';
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
  taskHistory: [],
  resizingState: {
    taskId: null,
    temporaryDuration: null,
    temporaryEndTime: null,
  },
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

// Helper function to handle tasks that span multiple days
const handleMultiDayTask = (task: OptimalTask, startTime: Date, endTime: Date): OptimalTask[] => {
  // If start and end are on the same day, return original task
  if (isSameDay(startTime, endTime)) {
    return [{ ...task, startTime, nextStartTime: endTime }];
  }

  const daysDifference = differenceInDays(endTime, startTime);
  const tasks: OptimalTask[] = [];

  // Create a task for each day
  for (let i = 0; i <= daysDifference; i++) {
    const currentDate = addDays(startTime, i);
    const taskDate = format(currentDate, 'yyyy-MM-dd');
    const isFirstDay = i === 0;
    const isLastDay = i === daysDifference;

    let dailyStartTime: Date;
    let dailyEndTime: Date;

    if (isFirstDay) {
      // First day: from original start time to end of day (23:59:59)
      dailyStartTime = new Date(startTime);
      dailyEndTime = new Date(startOfDay(addDays(currentDate, 1)));
      dailyEndTime.setMilliseconds(-1); // Set to 23:59:59.999
    } else if (isLastDay) {
      // Last day: from start of day (00:00) to original end time
      dailyStartTime = new Date(startOfDay(currentDate));
      dailyEndTime = new Date(endTime);
    } else {
      // Middle days: full day (00:00 to 23:59:59)
      dailyStartTime = new Date(startOfDay(currentDate));
      dailyEndTime = new Date(startOfDay(addDays(currentDate, 1)));
      dailyEndTime.setMilliseconds(-1); // Set to 23:59:59.999
    }

    const newTask: OptimalTask = {
      ...task,
      id: isFirstDay ? task.id : `${task.id}_day_${i}`,
      taskDate,
      startTime: dailyStartTime,
      nextStartTime: dailyEndTime,
      time: `${format(dailyStartTime, 'HH:mm')}—${format(dailyEndTime, 'HH:mm')}`,
      isPartOfMultiDay: true,
      originalTaskId: isFirstDay ? task.id : task.id, // Reference to the original task
      multiDaySequence: i, // Track the sequence of days
    };

    tasks.push(newTask);
  }

  return tasks;
};

// Modify the updateTask function to handle multi-day tasks
export const updateTask = (id: string, updates: Partial<OptimalTask>) => {
  updateStateAndStorage((state) => {
    const task = state.tasks.find((t: OptimalTask) => t.id === id);
    if (!task) return state;

    // If this is part of a multi-day task, we need to update all related tasks
    const isPartOfMultiDay = task.isPartOfMultiDay;
    const originalTaskId = task.originalTaskId || task.id;

    // Get all related tasks if this is part of a multi-day task
    const relatedTasks = isPartOfMultiDay
      ? state.tasks.filter((t) => t.originalTaskId === originalTaskId || t.id === originalTaskId)
      : [];

    // If updating time/date/duration, we need to handle potential multi-day spanning
    if (updates.startTime || updates.nextStartTime || updates.duration) {
      const newStartTime = updates.startTime || task.startTime;
      const newEndTime =
        updates.nextStartTime ||
        (newStartTime && updates.duration
          ? addMilliseconds(newStartTime, updates.duration)
          : task.nextStartTime);

      if (newStartTime && newEndTime && !isSameDay(newStartTime, newEndTime)) {
        // Remove all existing related tasks
        const nonRelatedTasks = state.tasks.filter(
          (t) => !relatedTasks.some((rt) => rt.id === t.id),
        );

        // Create new multi-day tasks
        const multiDayTasks = handleMultiDayTask({ ...task, ...updates }, newStartTime, newEndTime);

        return {
          ...state,
          tasks: [...nonRelatedTasks, ...multiDayTasks],
        };
      }
    }

    // For non-time/date updates or single-day tasks, update normally
    return {
      ...state,
      tasks: state.tasks.map((t: OptimalTask) => {
        // If this is part of a multi-day task, update all related tasks
        if (isPartOfMultiDay && (t.id === originalTaskId || t.originalTaskId === originalTaskId)) {
          return { ...t, ...updates };
        }
        // Otherwise, just update the specific task
        return t.id === id ? { ...t, ...updates } : t;
      }),
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

// Modify the setFocused function to handle multi-day tasks
export const setFocused = (id: string, isFocused: boolean) => {
  updateStateAndStorage((state) => {
    const taskToFocus = state.tasks.find((task: OptimalTask) => task.id === id);
    if (!taskToFocus) return state;

    let finalTasks = [...state.tasks];
    let finalHistory = [...state.taskHistory];
    let finalFocusedId: string | null = state.focusedTaskId;

    if (isFocused) {
      // Update time spent for previously focused task if exists
      if (state.focusedTaskId) {
        const prevFocusedTask = state.tasks.find((t) => t.id === state.focusedTaskId);
        if (prevFocusedTask?.startTime) {
          const timeSpent = differenceInMilliseconds(new Date(), prevFocusedTask.startTime);
          finalTasks = finalTasks.map((task) =>
            task.id === prevFocusedTask.id
              ? { ...task, timeSpent: (task.timeSpent || 0) + timeSpent }
              : task,
          );
        }
      }

      finalFocusedId = id;
      const currentTime = Date.now();
      const newStartTime = new Date(currentTime);
      const originalDuration = taskToFocus.duration || ONE_HOUR_IN_MS;
      const newEndTime = addMilliseconds(newStartTime, originalDuration);

      // Check if the task will span multiple days
      if (!isSameDay(newStartTime, newEndTime)) {
        const multiDayTasks = handleMultiDayTask(taskToFocus, newStartTime, newEndTime);

        // Store the previous state for history
        finalHistory = [
          ...state.taskHistory,
          {
            taskId: taskToFocus.id,
            previousState: { ...taskToFocus },
            timestamp: Date.now(),
            action: 'focus' as const,
          },
        ];
        if (finalHistory.length > 20) finalHistory.shift();

        // Remove the original task and add the multi-day tasks
        finalTasks = state.tasks.filter((t) => t.id !== taskToFocus.id).concat(multiDayTasks);

        // Focus remains on the first task of the sequence
        finalFocusedId = multiDayTasks[0].id;
      } else {
        // Handle single-day focus as before
        const newTimeString = `${format(newStartTime, 'HH:mm')}—${format(newEndTime, 'HH:mm')}`;
        const newTaskDate = format(newStartTime, 'yyyy-MM-dd');

        const focusedTaskUpdates = {
          taskDate: newTaskDate,
          startTime: newStartTime,
          nextStartTime: newEndTime,
          time: newTimeString,
          isFocused: true,
        };

        finalHistory = [
          ...state.taskHistory,
          {
            taskId: taskToFocus.id,
            previousState: { ...taskToFocus },
            timestamp: Date.now(),
            action: 'focus' as const,
          },
        ];
        if (finalHistory.length > 20) finalHistory.shift();

        const overlappingUpdates = calculateAffectedTaskUpdates(
          id,
          newStartTime,
          originalDuration,
          state.tasks,
        );

        const updatesMap = new Map<string, Partial<OptimalTask>>();
        updatesMap.set(id, focusedTaskUpdates);

        overlappingUpdates.forEach((overlapUpdate) => {
          if (overlapUpdate.id !== id) {
            const existingUpdates = updatesMap.get(overlapUpdate.id) || {};
            updatesMap.set(overlapUpdate.id, { ...existingUpdates, ...overlapUpdate.updates });
          }
        });

        finalTasks = state.tasks.map((originalTask) => {
          const calculatedUpdates = updatesMap.get(originalTask.id);
          const updatedTask = { ...originalTask, ...(calculatedUpdates || {}) };
          updatedTask.isFocused = originalTask.id === id;
          return updatedTask;
        });
      }
    } else {
      // When unfocusing, update the time spent
      if (taskToFocus.startTime) {
        const timeSpent = differenceInMilliseconds(new Date(), taskToFocus.startTime);
        finalTasks = finalTasks.map((task) =>
          task.id === taskToFocus.id
            ? { ...task, timeSpent: (task.timeSpent || 0) + timeSpent, isFocused: false }
            : task,
        );
      }
      finalFocusedId = null;
    }

    return {
      ...state,
      tasks: finalTasks,
      focusedTaskId: finalFocusedId,
      taskHistory: finalHistory,
    };
  });
};

export const calculateTaskProgress = (task: OptimalTask): number => {
  if (!task.subtasks || task.subtasks.length === 0) {
    return task.completed ? 100 : 0;
  }

  const completedSubtasks = task.subtasks.filter((subtask) => subtask.isCompleted).length;
  return Math.round((completedSubtasks / task.subtasks.length) * 100);
};

export const toggleTaskCompletion = (id: string) => {
  updateStateAndStorage((state) => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return state;

    const newCompleted = !task.completed;

    // If completing the task, mark all subtasks as completed
    const updatedSubtasks = task.subtasks.map((subtask) => ({
      ...subtask,
      isCompleted: newCompleted ? true : subtask.isCompleted,
    }));

    return {
      ...state,
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: newCompleted,
              subtasks: updatedSubtasks,
              progress: newCompleted
                ? 100
                : calculateTaskProgress({ ...t, subtasks: updatedSubtasks }),
            }
          : t,
      ),
    };
  });
};

export const toggleSubtaskCompletion = (taskId: string, subtaskId: string) => {
  updateStateAndStorage((state) => {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return state;

    const updatedSubtasks = task.subtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, isCompleted: !subtask.isCompleted } : subtask,
    );

    const newProgress = calculateTaskProgress({ ...task, subtasks: updatedSubtasks });
    const allSubtasksCompleted = updatedSubtasks.every((subtask) => subtask.isCompleted);

    return {
      ...state,
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: updatedSubtasks,
              progress: newProgress,
              completed: allSubtasksCompleted,
            }
          : t,
      ),
    };
  });
};

export const clearTasks = () => {
  storageAdapter.clear();
  tasksStore.setState(() => ({
    tasks: [],
    selectedDate: today,
    focusedTaskId: null,
    editingTaskId: null,
    highlightedTaskId: null,
    taskHistory: [],
    resizingState: {
      taskId: null,
      temporaryDuration: null,
      temporaryEndTime: null,
    },
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

    // Parse the new start time Date object
    const newStartTime = parse(time, 'HH:mm', date);

    // Calculate the new end time Date object using the task's duration
    const duration = task.duration || ONE_HOUR_IN_MS; // Use default if duration is missing
    const newEndTime = addMilliseconds(newStartTime, duration);

    // Format the new time string using the calculated start and end times
    const newTimeString = `${format(newStartTime, 'HH:mm')}—${format(newEndTime, 'HH:mm')}`;

    return {
      ...state,
      tasks: state.tasks.map((t: OptimalTask) =>
        t.id === taskId
          ? {
              ...t,
              taskDate,
              startTime: newStartTime, // Update startTime Date object
              nextStartTime: newEndTime, // Update nextStartTime (which is the end time) Date object
              time: newTimeString, // Update the time string
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
    // Use the selected date as the base
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
      // Use default time if none provided, but still use selected date
      const defaultTime = getNextFifteenMinuteInterval();
      startTime = parse(
        `${taskDate} ${format(defaultTime, 'HH:mm')}`,
        'yyyy-MM-dd HH:mm',
        new Date(),
      );
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
      timeSpent: 0, // Initialize time spent
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

// Helper to calculate necessary updates for overlapping tasks
const calculateAffectedTaskUpdates = (
  focusedTaskId: string,
  focusedTaskNewStartTime: Date,
  focusedTaskDuration: number,
  currentTasks: OptimalTask[],
): { id: string; updates: Partial<OptimalTask> }[] => {
  const updatesToApply: { id: string; updates: Partial<OptimalTask> }[] = [];
  const taskDate = format(focusedTaskNewStartTime, 'yyyy-MM-dd');

  const tasksOnDate = currentTasks.filter(
    (task) => task.taskDate === taskDate && task.id !== focusedTaskId,
  );

  if (tasksOnDate.length === 0) return [];

  const startTimeInMinutes =
    getHours(focusedTaskNewStartTime) * 60 + getMinutes(focusedTaskNewStartTime);
  const endTimeInMinutes = startTimeInMinutes + focusedTaskDuration / (60 * 1000);

  const affectedTasks = tasksOnDate.filter((task) => {
    if (!task.time || task.completed) return false;

    const [taskStartTimeStr] = task.time.split('—');
    const [taskHours, taskMinutes] = taskStartTimeStr.split(':').map(Number);
    if (isNaN(taskHours) || isNaN(taskMinutes)) return false;
    const taskStartInMinutes = taskHours * 60 + taskMinutes;
    const taskDuration = task.duration || ONE_HOUR_IN_MS;
    const taskEndInMinutes = taskStartInMinutes + taskDuration / (60 * 1000);

    const noOverlap =
      taskEndInMinutes <= startTimeInMinutes || taskStartInMinutes >= endTimeInMinutes;

    return !noOverlap;
  });

  if (affectedTasks.length === 0) return [];

  const sortedTasks = [...affectedTasks].sort((a, b) => {
    if (!a.time || !b.time) return 0;
    const [aStartTimeStr] = a.time.split('—');
    const [bStartTimeStr] = b.time.split('—');
    const [aHours, aMinutes] = aStartTimeStr.split(':').map(Number);
    const [bHours, bMinutes] = bStartTimeStr.split(':').map(Number);
    if (isNaN(aHours) || isNaN(aMinutes) || isNaN(bHours) || isNaN(bMinutes)) return 0;
    const aStartInMinutes = aHours * 60 + aMinutes;
    const bStartInMinutes = bHours * 60 + bMinutes;
    return aStartInMinutes - bStartInMinutes;
  });

  // Calculate the next 5-minute block after the focused task's end time
  const focusedTaskEndTime = addMilliseconds(focusedTaskNewStartTime, focusedTaskDuration);
  const nextFiveMinBlock = getNextFiveMinuteInterval(focusedTaskEndTime);
  let previousTaskEndTime = nextFiveMinBlock;
  const focusedDateStr = format(focusedTaskNewStartTime, 'yyyy-MM-dd');

  for (const taskToUpdate of sortedTasks) {
    const currentTaskDuration = taskToUpdate.duration || ONE_HOUR_IN_MS;
    const newStartTime = new Date(previousTaskEndTime);
    const newEndTime = addMilliseconds(newStartTime, currentTaskDuration);

    if (format(newStartTime, 'yyyy-MM-dd') === focusedDateStr) {
      const taskUpdate: Partial<OptimalTask> = {
        taskDate: focusedDateStr,
        startTime: newStartTime,
        nextStartTime: newEndTime,
        time: `${format(newStartTime, 'HH:mm')}—${format(newEndTime, 'HH:mm')}`,
      };
      updatesToApply.push({ id: taskToUpdate.id, updates: taskUpdate });

      // For the next task, use the next 5-minute block after this task's end time
      previousTaskEndTime = getNextFiveMinuteInterval(newEndTime);
    } else {
      break;
    }
  }

  return updatesToApply;
};

// Resizing state management functions
export const setResizingState = (
  taskId: string | null,
  temporaryDuration: number | null = null,
  temporaryEndTime: Date | null = null,
) => {
  tasksStore.setState((state) => ({
    ...state,
    resizingState: {
      taskId,
      temporaryDuration,
      temporaryEndTime,
    },
  }));
};

export const clearResizingState = () => {
  tasksStore.setState((state) => ({
    ...state,
    resizingState: {
      taskId: null,
      temporaryDuration: null,
      temporaryEndTime: null,
    },
  }));
};

// Add a new function to undo the last focus action
export const undoLastFocusAction = () => {
  updateStateAndStorage((state) => {
    const lastHistoryEntry = state.taskHistory[state.taskHistory.length - 1];

    if (!lastHistoryEntry || lastHistoryEntry.action !== 'focus') return state;

    // Restore the task to its previous state
    const updatedTasks = state.tasks.map((task: OptimalTask) =>
      task.id === lastHistoryEntry.taskId
        ? { ...lastHistoryEntry.previousState, isFocused: false }
        : task,
    );

    // Remove the last history entry
    const updatedHistory = state.taskHistory.slice(0, -1);

    return {
      ...state,
      tasks: updatedTasks,
      focusedTaskId: null,
      taskHistory: updatedHistory,
    };
  });
};

// Action for automatic focus based on current time
export const setAutomaticFocus = (taskId: string | null) => {
  console.log(`[Automatic Focus] Setting focus to: ${taskId ?? 'none'}`); // DEBUG
  updateStateAndStorage((state) => {
    // Check if the focus state actually needs changing
    if (state.focusedTaskId === taskId) {
      // If the target taskId is already focused, ensure the isFocused flags are correct
      // This handles cases where manual focus might have left flags inconsistent
      let needsUpdate = false;
      state.tasks.forEach((task) => {
        if (task.id === taskId && !task.isFocused) needsUpdate = true;
        if (task.id !== taskId && task.isFocused) needsUpdate = true;
      });
      if (!needsUpdate) return state; // No change needed
    } else {
      // If the target taskId is different, we definitely need an update
    }

    return {
      ...state,
      focusedTaskId: taskId,
      tasks: state.tasks.map((task) => ({
        ...task,
        isFocused: task.id === taskId,
      })),
    };
  });
};

// Add new action to update time spent
export const updateTaskTimeSpent = (taskId: string, additionalTime: number) => {
  updateStateAndStorage((state) => ({
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId ? { ...task, timeSpent: (task.timeSpent || 0) + additionalTime } : task,
    ),
  }));
};
