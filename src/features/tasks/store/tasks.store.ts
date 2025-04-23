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
  TimerState,
} from '../types/task.types';

// Initialize the storage adapter (can be easily swapped with a different implementation)
const storageAdapter: StorageAdapter = new LocalStorageAdapter();

// Get today's date as a string in YYYY-MM-DD format
const today = format(new Date(), 'yyyy-MM-dd');

// Get timer states from localStorage or initialize empty object
const getStoredTimerStates = (): Record<string, TimerState> => {
  const timerStateJson = localStorage.getItem('timerStates');
  if (!timerStateJson) return {};
  try {
    return JSON.parse(timerStateJson);
  } catch {
    return {};
  }
};

// Helper function to update timer states in localStorage
const saveTimerStates = (timerStates: Record<string, TimerState>) => {
  localStorage.setItem('timerStates', JSON.stringify(timerStates));
};

// Get focused task from localStorage
const getStoredFocusedTask = () => {
  const focusedTaskId = localStorage.getItem('focusedTaskId');
  return focusedTaskId || null;
};

// Save focused task to localStorage
const saveFocusedTask = (taskId: string | null) => {
  if (taskId) {
    localStorage.setItem('focusedTaskId', taskId);
  } else {
    localStorage.removeItem('focusedTaskId');
  }
};

// Initialize store with tasks from storage
const initialState: TasksState = {
  tasks: storageAdapter.getTasks().map((task: OptimalTask) => {
    const focusedTaskId = getStoredFocusedTask();
    return {
      ...task,
      taskDate: task.taskDate || today,
      isFocused: task.id === focusedTaskId,
    };
  }),
  selectedDate: today,
  focusedTaskId: getStoredFocusedTask(),
  editingTaskId: null,
  highlightedTaskId: null,
  taskHistory: [],
  timerStates: getStoredTimerStates(),
  resizingState: {
    taskId: null,
    temporaryDuration: null,
    temporaryEndTime: null,
  },
  lastUpdate: Date.now(),
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
  // Get all tasks for this date
  const tasksForDate = tasksStore.state.tasks.filter((task: OptimalTask) => task.taskDate === date);

  // For multi-day tasks, ensure we only show tasks that belong to this date
  // If a task is part of a multi-day set, it should only appear in its assigned day
  const filteredTasks = tasksForDate.filter((task: OptimalTask) => {
    // If it's not a multi-day task, include it
    if (!task.isPartOfMultiDay) {
      return true;
    }

    // For multi-day tasks, only include if this is its assigned day
    const taskDate = task.taskDate;
    return taskDate === date;
  });

  return filteredTasks;
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

  // Generate a unique sequence ID for this multi-day task set
  const multiDaySetId = task.multiDaySetId || uuidv4();

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

    // Calculate duration for this segment
    const segmentDuration = differenceInMilliseconds(dailyEndTime, dailyStartTime);

    // Generate a unique ID for each day's segment
    const segmentId = isFirstDay ? task.id : uuidv4();

    const newTask: OptimalTask = {
      ...task,
      id: segmentId,
      taskDate,
      startTime: dailyStartTime,
      nextStartTime: dailyEndTime,
      duration: segmentDuration,
      time: `${format(dailyStartTime, 'HH:mm')}—${format(dailyEndTime, 'HH:mm')}`,
      isPartOfMultiDay: true,
      originalTaskId: task.id, // Always reference the original task ID
      multiDaySetId, // Add the set ID to track related tasks
      multiDaySequence: i, // Track the sequence of days
      isFirstDayOfSet: isFirstDay,
      isLastDayOfSet: isLastDay,
    };

    tasks.push(newTask);
  }

  return tasks;
};

// Modify the updateTask function to handle multi-day tasks
export const updateTask = (id: string, updates: Partial<OptimalTask>) => {
  updateStateAndStorage((state) => {
    const taskIndex = state.tasks.findIndex((t: OptimalTask) => t.id === id);
    if (taskIndex === -1) return state;

    const task = state.tasks[taskIndex];

    // If this is part of a multi-day task, we need to update all related tasks
    const isPartOfMultiDay = task.isPartOfMultiDay;
    const multiDaySetId = task.multiDaySetId;

    // If updating time/date/duration, we need to handle potential multi-day spanning
    if (
      updates.startTime !== undefined ||
      updates.nextStartTime !== undefined ||
      updates.duration !== undefined
    ) {
      // Determine if this update is primarily a resize operation (only duration/end time changed)
      const isResizeOperation =
        updates.duration !== undefined &&
        updates.nextStartTime !== undefined &&
        updates.startTime === undefined;

      // For resize operations, keep the original start time
      const newStartTime = isResizeOperation ? task.startTime : updates.startTime || task.startTime;

      // Ensure duration is valid, fall back to task's duration if needed
      const effectiveDuration = updates.duration ?? task.duration ?? 0;

      // Calculate newEndTime based on start time and duration, primarily using these unless nextStartTime is explicitly provided
      const calculatedEndTime = newStartTime
        ? addMilliseconds(newStartTime, effectiveDuration)
        : null;
      // Prefer updates.nextStartTime if provided (comes from resize), otherwise use calculated end time
      const newEndTime = updates.nextStartTime || calculatedEndTime;

      // Check if this task should be focused based on its new time range
      const now = new Date();
      const shouldBeFocused = Boolean(
        newStartTime && newEndTime && now >= newStartTime && now < newEndTime && !task.completed,
      );

      // If the task should be focused and isn't already, or shouldn't be focused and is,
      // we'll update its focus state
      if (shouldBeFocused !== task.isFocused) {
        console.log(
          `[Task Update] Task ${id} focus state changing to ${shouldBeFocused} due to time range update`,
        );
        if (shouldBeFocused) {
          // Unfocus any other focused tasks
          state.tasks.forEach((t) => {
            if (t.id !== id && t.isFocused) {
              t.isFocused = false;
            }
          });
        }
        updates.isFocused = shouldBeFocused;
      }

      // Determine if the task truly spans multiple days based on duration
      const crossesMidnight = newStartTime && newEndTime && !isSameDay(newStartTime, newEndTime);
      // Consider it truly multi-day only if it crosses midnight AND duration is >= 24 hours
      const isTrulyMultiDay = crossesMidnight && effectiveDuration >= 24 * ONE_HOUR_IN_MS;

      // Split only if it's truly multi-day AND it's not just a resize
      if (!isResizeOperation && isTrulyMultiDay) {
        // --- Multi-day splitting logic (remains the same) ---
        console.log(
          'Triggering multi-day split for task:',
          task.id,
          'Duration:',
          effectiveDuration / ONE_HOUR_IN_MS,
          'hrs',
        );
        const relatedTasks = task.isPartOfMultiDay
          ? state.tasks.filter((t) => t.multiDaySetId === task.multiDaySetId)
          : [task]; // Include the current task itself if not previously multi-day

        // Remove all existing related tasks before creating new ones
        const nonRelatedTasks = state.tasks.filter(
          (t) => !relatedTasks.some((rt) => rt.id === t.id),
        );

        // Create new multi-day tasks
        const multiDayTasks = handleMultiDayTask(
          {
            ...task, // Base task properties
            ...updates, // Apply incoming updates
            startTime: newStartTime, // Ensure newStartTime is used
            nextStartTime: newEndTime, // Ensure newEndTime is used
            duration: effectiveDuration, // Ensure duration reflects the potentially new times
            multiDaySetId: task.multiDaySetId || undefined, // Preserve existing set ID
          },
          newStartTime!, // Assert non-null as isTrulyMultiDay checks this
          newEndTime!, // Assert non-null
        );

        return {
          ...state,
          tasks: [...nonRelatedTasks, ...multiDayTasks],
        };
        // --- End of multi-day splitting logic ---
      } else {
        // --- Standard update for single day, resize, OR simple overnight tasks ---
        console.log(
          'Applying standard update/resize/overnight for task:',
          task.id,
          'Updates:',
          updates,
        );
        const updatedTasks = [...state.tasks];
        updatedTasks[taskIndex] = {
          ...task,
          ...updates,
          // Ensure calculated fields are consistent
          // startTime: newStartTime, // Keep original start time if resizing or use updated
          duration: effectiveDuration,
          nextStartTime: newEndTime ?? undefined, // Convert null to undefined
          // Update the time string to reflect the new times
          time:
            newStartTime && newEndTime
              ? `${format(newStartTime, 'HH:mm')}—${format(newEndTime, 'HH:mm')}`
              : task.time,
        };
        return {
          ...state,
          tasks: updatedTasks,
        };
        // --- End of standard update ---
      }
    }

    // Fallback/Default update logic (if not time/date/duration related)
    console.log('Applying fallback update for task:', task.id, 'Updates:', updates);
    const updatedTasks = [...state.tasks];
    updatedTasks[taskIndex] = { ...task, ...updates };
    return {
      ...state,
      tasks: updatedTasks,
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
  tasksStore.setState((state) => {
    // Update tasks' focused states
    const updatedTasks = state.tasks.map((task) => ({
      ...task,
      isFocused: task.id === taskId,
    }));

    saveFocusedTask(taskId);

    // If a task is being focused, sync it with the task-form store
    if (taskId) {
      const focusedTask = state.tasks.find((task) => task.id === taskId);
      if (focusedTask) {
        // Import dynamically to avoid circular dependencies
        import('./task-form.store').then(({ loadTaskForEditing }) => {
          loadTaskForEditing(focusedTask);
        });
      }
    }

    return {
      ...state,
      tasks: updatedTasks,
      focusedTaskId: taskId,
    };
  });
};

export const setEditingTaskId = (taskId: string | null) => {
  tasksStore.setState((state) => ({
    ...state,
    editingTaskId: taskId,
  }));
};

// Modify the setFocused function to handle multi-day tasks and options
export const setFocused = (
  id: string,
  isFocused: boolean,
  options?: { preserveTimeAndDate?: boolean },
) => {
  updateStateAndStorage((state) => {
    const taskToFocus = state.tasks.find((t: OptimalTask) => t.id === id);
    if (!taskToFocus) return state; // Task not found

    // Store the previous state for potential undo
    const previousTasksState = state.tasks.map((t) => ({ ...t }));
    const previousFocusedId = state.focusedTaskId;

    let newTasks = state.tasks;
    let newFocusedTaskId: string | null = state.focusedTaskId;
    let affectedTaskUpdates: { id: string; updates: Partial<OptimalTask> }[] = [];

    if (isFocused) {
      // Unfocus any previously focused task (except the current task if it's already focused)
      newTasks = newTasks.map((t) => (t.isFocused && t.id !== id ? { ...t, isFocused: false } : t));
      newFocusedTaskId = id;

      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');

      // Determine start time and date based on options
      const preserve = options?.preserveTimeAndDate ?? false;
      const taskStartTime = preserve ? taskToFocus.startTime || now : now;
      const taskDateToUse = preserve ? taskToFocus.taskDate || todayStr : todayStr;
      // Calculate end time based on the determined start time and existing duration
      const taskEndTime = addMilliseconds(taskStartTime, taskToFocus.duration || ONE_HOUR_IN_MS);

      const focusUpdates: Partial<OptimalTask> = {
        isFocused: true,
        // Use the determined start time
        startTime: taskStartTime,
        nextStartTime: taskEndTime,
        // Update time string based on the determined start time
        time: `${format(taskStartTime, 'HH:mm')}—${format(taskEndTime, 'HH:mm')}`,
        taskDate: taskDateToUse, // Use the determined task date
        // Preserve the existing timeSpent when refocusing
        timeSpent: taskToFocus.timeSpent || 0,
      };

      // Calculate updates for overlapping tasks based on the determined date
      affectedTaskUpdates = calculateAffectedTaskUpdates(
        id,
        taskStartTime, // Use the determined startTime
        taskToFocus.duration || ONE_HOUR_IN_MS,
        newTasks.filter((t) => t.id !== id && t.taskDate === taskDateToUse), // Filter based on the determined task date
      );

      // Apply updates to affected tasks
      newTasks = newTasks.map((task) => {
        if (task.id === id) {
          return { ...task, ...focusUpdates };
        }
        const affectedUpdate = affectedTaskUpdates.find((u) => u.id === task.id);
        return affectedUpdate ? { ...task, ...affectedUpdate.updates } : task;
      });
    } else {
      // Unfocusing the specified task (no changes needed here)
      newTasks = newTasks.map((t) => (t.id === id ? { ...t, isFocused: false } : t));
      if (state.focusedTaskId === id) {
        newFocusedTaskId = null;
      }
    }

    // Persist the focused task ID to local storage
    saveFocusedTask(newFocusedTaskId);

    // Define the type for the new history entry explicitly
    type HistoryEntry = {
      tasks: OptimalTask[];
      focusedTaskId: string | null;
      affectedTaskUpdates: { id: string; previousState: OptimalTask | undefined }[];
    };

    // Add the previous state to history for undo
    const newHistoryEntry: HistoryEntry = {
      tasks: previousTasksState,
      focusedTaskId: previousFocusedId,
      affectedTaskUpdates: affectedTaskUpdates.map((update) => ({
        id: update.id,
        previousState: previousTasksState.find((t) => t.id === update.id),
      })),
    };

    // Ensure taskHistory type compatibility explicitly
    const updatedTaskHistory = [...state.taskHistory, newHistoryEntry].slice(
      -10,
    ) as typeof state.taskHistory;

    return {
      ...state,
      tasks: newTasks,
      focusedTaskId: newFocusedTaskId,
      taskHistory: updatedTaskHistory, // Use the explicitly typed history
    };
  });

  // Start/Stop timer logic after state update
  const updatedState = tasksStore.state;
  const focusedTask = updatedState.tasks.find((t) => t.id === updatedState.focusedTaskId);

  // Use isFocused directly, no need to check the task state again
  if (isFocused && focusedTask && focusedTask.startTime) {
    toggleTaskTimer(id, true);
  } else if (!isFocused) {
    // Find the task being unfocused *within the current state* to check its timer status
    const taskThatWasUnfocused = updatedState.tasks.find((t: OptimalTask) => t.id === id);
    if (taskThatWasUnfocused && updatedState.timerStates[id]?.isRunning) {
      toggleTaskTimer(id, false);
    }
  }
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

    // If completing the task and it has a start time, update the duration
    let updatedTask = { ...task };
    if (newCompleted && task.startTime) {
      const currentTime = new Date();
      const actualDuration = currentTime.getTime() - task.startTime.getTime();

      // Only update duration if task was completed before its end time
      if (actualDuration < (task.duration || 0)) {
        updatedTask = {
          ...task,
          duration: actualDuration,
          nextStartTime: currentTime,
        };
      }
    }

    return {
      ...state,
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...updatedTask,
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
  // Clear all stored canvases
  tasksStore.state.tasks.forEach((task) => {
    localStorage.removeItem(`canvas_${task.id}`);
  });

  // Clear timer UI state
  localStorage.removeItem('activeTimer');

  // Clear storage adapter
  storageAdapter.clear();

  updateStateAndStorage((state) => ({
    ...state,
    tasks: [],
    selectedDate: today,
    focusedTaskId: null,
    editingTaskId: null,
    highlightedTaskId: null,
    taskHistory: [],
    timerStates: {},
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

// Add a resizing lock to prevent automatic focus during resize operations
let isResizingActive = false;

export const setResizingState = (
  taskId: string | null,
  temporaryDuration: number | null = null,
  temporaryEndTime: Date | null = null,
) => {
  // If starting a resize operation (taskId not null), set the lock
  if (taskId !== null) {
    isResizingActive = true;
  }

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
  // Release the resize lock after a short delay to allow the store to update
  setTimeout(() => {
    isResizingActive = false;
  }, 500);

  tasksStore.setState((state) => ({
    ...state,
    resizingState: {
      taskId: null,
      temporaryDuration: null,
      temporaryEndTime: null,
    },
  }));
};

// Add a function to check if resize is in progress
export const isResizeInProgress = () => {
  return isResizingActive;
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
  // Don't override manual focus with automatic focus
  const currentFocusedId = tasksStore.state.focusedTaskId;
  if (currentFocusedId) {
    // Check if the current focused task has ended
    const currentFocusedTask = tasksStore.state.tasks.find((t) => t.id === currentFocusedId);
    if (currentFocusedTask && currentFocusedTask.nextStartTime) {
      const endTime =
        typeof currentFocusedTask.nextStartTime === 'string'
          ? parseISO(currentFocusedTask.nextStartTime)
          : currentFocusedTask.nextStartTime;

      // If the current task has ended, unfocus it
      if (endTime < new Date()) {
        setFocused(currentFocusedId, false);
      } else {
        return; // Exit if there's already a focused task that hasn't ended
      }
    }
  }

  console.log(`[Automatic Focus] Setting focus to: ${taskId ?? 'none'}`);
  updateStateAndStorage((state) => {
    // Update tasks' focused states
    const updatedTasks = state.tasks.map((task) => ({
      ...task,
      isFocused: task.id === taskId,
    }));

    if (taskId) {
      saveFocusedTask(taskId);
    }

    return {
      ...state,
      tasks: updatedTasks,
      focusedTaskId: taskId,
    };
  });

  // Start timer for the automatically focused task
  if (taskId) {
    const focusedTask = tasksStore.state.tasks.find((t) => t.id === taskId);
    if (focusedTask && focusedTask.startTime) {
      toggleTaskTimer(taskId, true);
    }
  }
};

// Timer State Management
export const toggleTaskTimer = (taskId: string, isRunning: boolean) => {
  // Check if the task is focused before starting the timer
  const taskToToggle = tasksStore.state.tasks.find((t) => t.id === taskId);

  // If trying to start the timer but task is not focused, don't allow it
  if (isRunning && taskToToggle && !taskToToggle.isFocused) {
    return; // Don't start timer if task is not focused
  }

  // Update this timer's state
  tasksStore.setState((state) => {
    const newTimerStates = {
      ...state.timerStates,
      [taskId]: { isRunning, lastUpdatedAt: Date.now() },
    };
    saveTimerStates(newTimerStates);
    return {
      ...state,
      timerStates: newTimerStates,
    };
  });
};

export const getTaskTimerState = (taskId: string): TimerState => {
  return tasksStore.state.timerStates[taskId] || { isRunning: false, lastUpdatedAt: 0 };
};

export const updateTaskTimeSpent = (taskId: string, additionalTime: number) => {
  updateStateAndStorage((state) => {
    const updatedTasks = state.tasks.map((task) =>
      task.id === taskId ? { ...task, timeSpent: (task.timeSpent || 0) + additionalTime } : task,
    );
    return {
      ...state,
      tasks: updatedTasks,
    };
  });
};
