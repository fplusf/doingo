import { remindersStore } from '@/features/reminders/store/reminders.store';
import { batchPredictTaskProperties } from '@/lib/groq-service';
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
import { syncTaskReminder } from './sync-task-reminder';

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
  isResizingTask: false,
  justFinishedResizing: false,
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

  updateStateAndStorage((state) => {
    const generatedId = (task as { id?: string }).id ?? uuidv4();
    const newTask = {
      ...task,
      id: generatedId,
      priority: task.priority || 'none',
      taskDate,
      subtasks: task.subtasks || [],
      progress: task.progress || 0,
    };
    setTimeout(() => syncTaskReminder(newTask), 0);
    return {
      ...state,
      tasks: [...state.tasks, newTask],
    };
  });
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

        // Handle tasks that cross midnight but are less than 24 hours
        let taskDate = task.taskDate;
        let endsNextDay = false;

        if (newStartTime && newEndTime) {
          // Keep the task on the date it starts on
          taskDate = format(newStartTime, 'yyyy-MM-dd');
          // Set endsNextDay flag if the task crosses midnight
          endsNextDay = !isSameDay(newStartTime, newEndTime);
          console.log(`Task ${task.id} starts on ${taskDate}, endsNextDay: ${endsNextDay}`);
        }

        const updatedTasks = [...state.tasks];
        updatedTasks[taskIndex] = {
          ...task,
          ...updates,
          taskDate, // Use the date based on start time
          endsNextDay, // Add flag for UI to show +1 indicator
          duration: effectiveDuration,
          nextStartTime: newEndTime ?? undefined, // Convert null to undefined
          // Update the time string to reflect the new times
          time:
            newStartTime && newEndTime
              ? `${format(newStartTime, 'HH:mm')}—${format(newEndTime, 'HH:mm')}`
              : task.time,
        };
        setTimeout(() => syncTaskReminder(updatedTasks[taskIndex]), 0);
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
  // Find the task before deletion to store in history
  const taskToDelete = tasksStore.state.tasks.find((task) => task.id === id);

  // remove the canvas data from local storage
  if (id) {
    localStorage.removeItem(`canvas_${id}`);
  }

  // Remove any reminder linked to this task
  const reminders = remindersStore.state.reminders;
  const linkedReminder = reminders.find((r) => r.taskId === id);
  if (linkedReminder) {
    import('@/features/reminders/store/reminders.store').then(({ deleteReminder }) => {
      deleteReminder(linkedReminder.id);
    });
  }

  updateStateAndStorage((state) => ({
    ...state,
    tasks: state.tasks.filter((task) => task.id !== id),
  }));

  // Return the deleted task for history tracking
  return taskToDelete;
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
    // BUT only if we're not already editing this task (to prevent form overwrites)
    if (taskId) {
      const focusedTask = state.tasks.find((task) => task.id === taskId);
      if (focusedTask) {
        // Import dynamically to avoid circular dependencies
        import('./task-form.store').then(({ loadTaskForEditing, taskFormStore }) => {
          // GUARD: Only load if we're not already editing this task
          // This prevents overwriting the form when focusing a task that's already in the dialog
          const currentFormTaskId = taskFormStore.state.taskId;
          const isCurrentlyEditing = currentFormTaskId === taskId;

          if (!isCurrentlyEditing) {
            console.log(`Loading task ${taskId} into form (not currently editing)`);
            loadTaskForEditing(focusedTask);
          } else {
            console.log(`Skipping form load for task ${taskId} - already being edited`);
          }
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
      const taskEndTime = addMilliseconds(taskStartTime, taskToFocus.duration || 45 * 60 * 1000);

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
        taskToFocus.duration || 45 * 60 * 1000,
        newTasks.filter(
          (t) => t.id !== id && t.taskDate === taskDateToUse && !t.completed && !t.isTimeFixed,
        ), // Filter based on the determined task date, also explicitly excluding completed/fixed here for safety
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
  // Find the task before toggling to store its previous state
  const taskBeforeToggle = tasksStore.state.tasks.find((t) => t.id === id);

  updateStateAndStorage((state) => {
    const taskIndex = state.tasks.findIndex((t_find) => t_find.id === id);
    if (taskIndex === -1) {
      return state;
    }

    const originalTask = state.tasks[taskIndex];
    const newCompleted = !originalTask.completed;

    // Create a mutable copy for properties that might change
    let newDuration = originalTask.duration;
    let newNextStartTime = originalTask.nextStartTime;

    // If completing the task, mark all subtasks as completed.
    // If un-completing, subtasks retain their original completion status.
    const updatedSubtasks = originalTask.subtasks.map((subtask) => ({
      ...subtask,
      isCompleted: newCompleted ? true : subtask.isCompleted,
    }));

    // If completing the task and it has a start time and was focused, update the duration
    if (newCompleted && originalTask.startTime && originalTask.isFocused) {
      const currentTime = new Date();
      const actualDuration = currentTime.getTime() - originalTask.startTime.getTime();

      // Only update duration if task was completed before its planned end time
      if (actualDuration < (originalTask.duration || 0)) {
        newDuration = actualDuration;
        newNextStartTime = currentTime;
      }
    }

    // Calculate progress using the new completed status
    // This fixes a bug where un-completing a task with no subtasks would leave progress at 100%
    const progressContext = {
      ...originalTask, // Base properties from original task
      subtasks: updatedSubtasks, // With potentially updated subtasks
      completed: newCompleted, // CRITICAL: Use the new completed status for calculation
    };
    const newProgress = newCompleted ? 100 : calculateTaskProgress(progressContext);

    const updatedTasksArray = state.tasks.map((taskInMap) => {
      if (taskInMap.id === id) {
        return {
          ...originalTask, // Spread originalTask to retain all its properties
          duration: newDuration, // Apply new duration
          nextStartTime: newNextStartTime, // Apply new next start time
          completed: newCompleted, // Apply new completion status
          subtasks: updatedSubtasks, // Apply new subtasks array
          progress: newProgress, // Apply new progress
        };
      }
      return taskInMap; // Return other tasks untouched
    });

    return {
      ...state,
      tasks: updatedTasksArray,
    };
  });

  // Sync with task form store
  // Get the updated task after the state change
  const updatedTask = tasksStore.state.tasks.find((t) => t.id === id);
  if (updatedTask) {
    // Import dynamically to avoid circular dependencies
    import('./task-form.store').then(({ updateCompletionStatus }) => {
      updateCompletionStatus(updatedTask.completed);
    });
  }

  // Return the previous task state for undo/redo
  return taskBeforeToggle;
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

  // Sync with task form store
  // We need to get the current task state after the update
  const updatedTask = tasksStore.state.tasks.find((t) => t.id === taskId);
  if (updatedTask) {
    // Import dynamically to avoid circular dependencies
    import('./task-form.store').then(({ updateCompletionStatus }) => {
      updateCompletionStatus(updatedTask.completed);
    });
  }
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
    isResizingTask: false,
    justFinishedResizing: false,
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
    const duration = task.duration || 45 * 60 * 1000; // Use default if duration is missing
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

    const updatedTasks = state.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            dueDate: date,
            dueTime: time,
            time: timeString,
          }
        : t,
    );
    const updatedTask = updatedTasks.find((t) => t.id === taskId);
    if (updatedTask) setTimeout(() => syncTaskReminder(updatedTask), 0);
    return {
      ...state,
      tasks: updatedTasks,
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
    // For the first task of the day, use the next 5-minute interval
    return format(getNextFiveMinuteInterval(), 'HH:mm');
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
    isDurationManuallySet?: boolean;
    isPriorityManuallySet?: boolean;
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
    const duration = values.duration && values.duration > 0 ? values.duration : undefined;

    // Calculate next start time
    const nextStartTime = duration
      ? addMilliseconds(startTime, duration)
      : addMilliseconds(startTime, 45 * 60 * 1000); // Use 45min as fallback for UI

    // Create default repetition option if not provided
    const defaultRepetition: RepetitionOption = {
      type: 'once',
      repeatInterval: 1,
    };

    const taskId = uuidv4();
    const task: OptimalTask = {
      id: taskId,
      title: values.title,
      notes: values.notes || '',
      emoji: values.emoji || undefined,
      time: timeString,
      duration: duration || 45 * 60 * 1000, // Ensure task always has a duration for UI purposes
      dueDate: values.dueDate,
      dueTime: values.dueTime,
      priority: values.priority || 'medium', // Use medium as default instead of none
      category: values.category || category,
      completed: false,
      isFocused: false,
      taskDate,
      subtasks: values.subtasks || [],
      progress: values.progress || 0,
      startTime,
      nextStartTime,
      repetition: values.repetition || defaultRepetition,
      timeSpent: 0, // Initialize time spent
    };

    addTask(task);

    // Fire-and-forget: ask AI for duration / priority / emoji if any of them were not
    // explicitly supplied by the user. When the response arrives we patch the task.
    (async () => {
      try {
        const needsDuration = !values.isDurationManuallySet;
        const needsPriority = !values.isPriorityManuallySet;
        const needsEmoji = !values.emoji;

        if (!(needsDuration || needsPriority || needsEmoji)) {
          return; // Nothing to predict
        }

        const {
          duration: predictedDuration,
          priority: predictedPriority,
          emoji: predictedEmoji,
        } = await batchPredictTaskProperties(values.title);

        const updates: Partial<OptimalTask> = {};

        if (needsEmoji && predictedEmoji && predictedEmoji.trim().length) {
          updates.emoji = predictedEmoji.trim();
        }

        if (needsPriority && predictedPriority && predictedPriority !== 'none') {
          updates.priority = predictedPriority;
        }

        if (needsDuration && predictedDuration && predictedDuration > 0) {
          updates.duration = predictedDuration;

          // Recalculate nextStartTime and time string
          const newNextStart = addMilliseconds(startTime, predictedDuration);
          updates.nextStartTime = newNextStart;
          updates.time = `${format(startTime, 'HH:mm')}—${format(newNextStart, 'HH:mm')}`;
        }

        if (Object.keys(updates).length > 0) {
          updateTask(taskId, updates);
        }
      } catch (err) {
        console.error('Failed to fetch AI task properties:', err);
      }
    })();

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
        values.duration && values.duration > 0 ? values.duration : task.duration || 45 * 60 * 1000;

      // Calculate next start time
      const nextStartTime = addMilliseconds(startTime, duration);

      // Create default repetition option if not provided
      const defaultRepetition: RepetitionOption = {
        type: 'once',
        repeatInterval: 1,
      };

      const finalUpdatedValues = {
        ...updatedValues,
        time: timeString,
        duration,
        taskDate,
        dueDate: values.dueDate,
        dueTime: values.dueTime,
        startTime,
        nextStartTime,
        repetition: values.repetition || task.repetition || defaultRepetition,
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
  currentTasks: OptimalTask[], // Already filtered for the correct date and excludes focused task
): { id: string; updates: Partial<OptimalTask> }[] => {
  const updatesToApply: { id: string; updates: Partial<OptimalTask> }[] = [];
  const taskDate = format(focusedTaskNewStartTime, 'yyyy-MM-dd'); // Ensure we only compare on the relevant date

  // Filter out completed, fixed-time, and the focused task itself BEFORE checking for overlaps
  const potentialOverlappingTasks = currentTasks.filter(
    (task) =>
      // task.id !== focusedTaskId && // This is already guaranteed by the caller filtering
      task.taskDate === taskDate && // Only consider tasks on the same day
      !task.completed && // **** Ignore completed tasks ****
      !task.isTimeFixed, // **** Ignore tasks with fixed time ****
  );

  if (potentialOverlappingTasks.length === 0) return [];

  const startTimeInMinutes =
    getHours(focusedTaskNewStartTime) * 60 + getMinutes(focusedTaskNewStartTime);
  const endTimeInMinutes = startTimeInMinutes + focusedTaskDuration / (60 * 1000);

  // Find ALL tasks that overlap with the focused task
  const overlappingTasks = potentialOverlappingTasks.filter((task) => {
    // Completed/Fixed checks are done above
    if (!task.time) return false; // Ignore tasks without a defined time

    const [taskStartTimeStr] = task.time.split('—');
    const [taskHours, taskMinutes] = taskStartTimeStr.split(':').map(Number);
    if (isNaN(taskHours) || isNaN(taskMinutes)) return false; // Invalid time format
    const taskStartInMinutes = taskHours * 60 + taskMinutes;
    // Use a default duration if task.duration is missing or invalid
    const taskDuration = task.duration && task.duration > 0 ? task.duration : 45 * 60 * 1000;
    const taskEndInMinutes = taskStartInMinutes + taskDuration / (60 * 1000);

    // Check for overlap: !(task ends before focus starts || task starts after focus ends)
    const noOverlap =
      taskEndInMinutes <= startTimeInMinutes || taskStartInMinutes >= endTimeInMinutes;

    return !noOverlap;
  });

  if (overlappingTasks.length === 0) return []; // No relevant overlapping tasks found

  // Sort overlapping tasks by start time to handle them in sequence
  overlappingTasks.sort((a, b) => {
    const aStartTime = a.startTime ? a.startTime.getTime() : 0;
    const bStartTime = b.startTime ? b.startTime.getTime() : 0;
    return aStartTime - bStartTime;
  });

  // Calculate the next available time slot starting from the focused task's end time
  let nextAvailableTime = addMilliseconds(focusedTaskNewStartTime, focusedTaskDuration);

  // Process each overlapping task
  for (const task of overlappingTasks) {
    // Use the next 5-minute interval after the current end time
    const nextFiveMinBlock = getNextFiveMinuteInterval(nextAvailableTime);
    const newStartTime = new Date(nextFiveMinBlock);
    // Use the duration of the current overlapping task
    const taskDuration = task.duration && task.duration > 0 ? task.duration : 45 * 60 * 1000;
    const newEndTime = addMilliseconds(newStartTime, taskDuration);

    // Ensure the shifted task still starts on the same day. If not, don't shift it.
    if (format(newStartTime, 'yyyy-MM-dd') === taskDate) {
      const taskUpdate: Partial<OptimalTask> = {
        startTime: newStartTime,
        nextStartTime: newEndTime,
        time: `${format(newStartTime, 'HH:mm')}—${format(newEndTime, 'HH:mm')}`,
      };
      updatesToApply.push({ id: task.id, updates: taskUpdate });

      // Update the next available time for the next task
      nextAvailableTime = newEndTime;
    } else {
      console.warn(
        `Task ${task.id} would be pushed to the next day by focus shift. Not applying automatic shift.`,
      );
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
    isResizingTask: true,
  }));
};

export const clearResizingState = () => {
  // Release the resize lock after a short delay to allow the store to update
  setTimeout(() => {
    isResizingActive = false;
  }, 500);

  tasksStore.setState((state) => {
    // Only clear if there was an active resize
    if (state.resizingState.taskId) {
      return {
        ...state,
        resizingState: {
          taskId: null,
          temporaryDuration: null,
          temporaryEndTime: null,
        },
        isResizingTask: false,
        justFinishedResizing: true,
        lastUpdate: Date.now(),
      };
    }
    return state; // No change if no resize was active
  });
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
  const currentFocusedId = tasksStore.state.focusedTaskId;
  const now = new Date();

  // --- Respect Manual Focus --- //
  if (currentFocusedId) {
    const currentFocusedTask = tasksStore.state.tasks.find((t) => t.id === currentFocusedId);
    if (currentFocusedTask && currentFocusedTask.nextStartTime) {
      const endTime =
        typeof currentFocusedTask.nextStartTime === 'string'
          ? parseISO(currentFocusedTask.nextStartTime)
          : currentFocusedTask.nextStartTime;

      // If the manually focused task hasn't ended yet, do nothing.
      if (now < endTime) {
        console.log(
          `[Automatic Focus] Manual focus on ${currentFocusedId} is still active (ends at ${format(
            endTime,
            'HH:mm:ss',
          )}). Automatic focus deferred.`,
        );
        return; // Exit early, respecting the manual focus
      }

      // If the manually focused task HAS ended, unfocus it before proceeding.
      console.log(
        `[Automatic Focus] Manual focus on ${currentFocusedId} ended. Unfocusing before checking for next task.`,
      );
      // Call setFocused to properly handle unfocusing and history (if needed)
      // Important: We pass `false` here to *unfocus*. This allows the rest of the function to potentially focus a *new* task.
      setFocused(currentFocusedId, false); // This will update the state
      // Note: We don't return here. We allow the function to continue below
      // to check if `taskId` (the one that *should* be focused now) can be focused.
    }
  }
  // --- End Respect Manual Focus --- //

  // --- Standard Automatic Focus Logic --- //
  // Check if the candidate task `taskId` should be focused.
  // Only proceed if there isn't *still* a focused task (e.g., if setFocused above failed or had side effects)
  // and the candidate `taskId` is not null.
  if (!tasksStore.state.focusedTaskId && taskId) {
    console.log(`[Automatic Focus] Setting focus to candidate: ${taskId}`);

    // Find the task details for the candidate taskId
    const taskToFocus = tasksStore.state.tasks.find((t) => t.id === taskId);

    // Only focus if the task exists and is not completed
    if (taskToFocus && !taskToFocus.completed) {
      updateStateAndStorage((state) => {
        const updatedTasks = state.tasks.map((task) => ({
          ...task,
          // Focus the candidate task, ensure others are not focused
          isFocused: task.id === taskId,
        }));
        saveFocusedTask(taskId); // Persist focus
        return {
          ...state,
          tasks: updatedTasks,
          focusedTaskId: taskId,
        };
      });

      // Start timer for the automatically focused task
      if (taskToFocus.startTime) {
        toggleTaskTimer(taskId, true);
      }
    } else if (!taskToFocus) {
      console.warn(`[Automatic Focus] Candidate task ${taskId} not found.`);
    } else if (taskToFocus.completed) {
      console.log(
        `[Automatic Focus] Candidate task ${taskId} is already completed. Skipping focus.`,
      );
    }
  } else if (taskId) {
    console.log(
      `[Automatic Focus] Skipping focus for candidate ${taskId} because another task (${tasksStore.state.focusedTaskId}) is still focused.`, // This might happen if the unfocus logic above is asynchronous or complex
    );
  } else {
    console.log('[Automatic Focus] No candidate task ID provided or needed.');
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

// Function to update break information for a task
export const updateTaskBreak = (
  taskId: string,
  startTime: Date,
  breakDurationMs: number,
  breakType: 'during' | 'after',
) => {
  updateStateAndStorage((state) => {
    const updatedTasks = state.tasks.map((task) => {
      if (task.id === taskId) {
        // Create a new break object or use existing one
        const currentBreak = task.break || {};

        // Update the specific break type
        return {
          ...task,
          break: {
            ...currentBreak,
            startTime,
            duration: breakDurationMs,
            type: breakType,
          },
        };
      }
      return task;
    });

    return {
      ...state,
      tasks: updatedTasks,
    };
  });
};

// Helper function to increment pomodoro sessions counter
export const incrementPomodoroSession = (taskId: string, sessionDuration: number) => {
  updateStateAndStorage((state) => {
    const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return state;

    const task = state.tasks[taskIndex];
    const updatedTasks = [...state.tasks];

    // Get existing sessions data or initialize new one
    const currentSessions = task.pomodoroSessions || { amount: 0, totalDuration: 0 };

    // Increment sessions count and add duration
    updatedTasks[taskIndex] = {
      ...task,
      pomodoroSessions: {
        amount: currentSessions.amount + 1,
        totalDuration: currentSessions.totalDuration + sessionDuration,
      },
    };

    return {
      ...state,
      tasks: updatedTasks,
    };
  });
};

// Helper function to increment break counter
export const incrementPomodoroBreak = (taskId: string, breakDuration: number) => {
  updateStateAndStorage((state) => {
    const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return state;

    const task = state.tasks[taskIndex];
    const updatedTasks = [...state.tasks];

    // Get existing breaks data or initialize new one
    const currentBreaks = task.pomodoroBreaks || { amount: 0, totalDuration: 0 };

    // Increment breaks count and add duration
    updatedTasks[taskIndex] = {
      ...task,
      pomodoroBreaks: {
        amount: currentBreaks.amount + 1,
        totalDuration: currentBreaks.totalDuration + breakDuration,
      },
    };

    return {
      ...state,
      tasks: updatedTasks,
    };
  });
};

// Function to add a break immediately after or during a task
export const addTaskBreak = (
  startTime: Date,
  durationInMs: number,
  breakType: 'during' | 'after',
  taskId?: string,
): void => {
  // If we have a taskId, update that specific task
  if (taskId) {
    updateTaskBreak(taskId, startTime, durationInMs, breakType);
    return;
  }

  // Otherwise, find which task comes before this startTime
  const state = tasksStore.state;
  const taskDate = format(startTime, 'yyyy-MM-dd');

  // Convert to array of OptimalTask objects
  const tasksForDateArray: OptimalTask[] = [];

  // Safely iterate through tasks and add to array
  state.tasks.forEach((task) => {
    if (task.taskDate === taskDate && !task.isGap) {
      tasksForDateArray.push(task);
    }
  });

  // Find the task that ends closest to but before the startTime
  let foundTaskId: string | null = null;
  let smallestTimeDifference = Infinity;

  for (const task of tasksForDateArray) {
    if (task.nextStartTime && task.nextStartTime <= startTime) {
      const timeDiff = differenceInMilliseconds(startTime, task.nextStartTime);
      if (timeDiff < smallestTimeDifference) {
        smallestTimeDifference = timeDiff;
        foundTaskId = task.id;
      }
    }
  }

  // If we found a task, update its break information
  if (foundTaskId) {
    updateTaskBreak(foundTaskId, startTime, durationInMs, breakType);
  } else {
    console.warn('Could not find a task to add break to for time:', startTime);
  }
};

export const calculateTaskEndTime = (task: OptimalTask): Date | null => {
  if (!task.startTime) return null;

  const duration = task.duration || 45 * 60 * 1000; // Use default if duration is missing
  return addMilliseconds(task.startTime, duration);
};

// Function to find free slots in the schedule
export const findFreeSlots = (date: string): { startTime: Date; duration: number }[] => {
  const tasksForDate = getTasksByDate(date);
  const freeSlots: { startTime: Date; duration: number }[] = [];

  // Sort tasks by start time
  const sortedTasks = [...tasksForDate].sort((a, b) => {
    const aTime = a.startTime?.getTime() || 0;
    const bTime = b.startTime?.getTime() || 0;
    return aTime - bTime;
  });

  // Start of day
  let currentTime = startOfDay(parseISO(date));
  const endOfDay = addDays(currentTime, 1);

  // Find gaps between tasks
  for (const task of sortedTasks) {
    if (!task.startTime) continue;

    const gapDuration = differenceInMilliseconds(task.startTime, currentTime);
    if (gapDuration >= ONE_HOUR_IN_MS) {
      freeSlots.push({
        startTime: new Date(currentTime),
        duration: gapDuration,
      });
    }
    currentTime =
      task.nextStartTime || addMilliseconds(task.startTime, task.duration || 45 * 60 * 1000);
  }

  // Check gap after last task
  const lastGapDuration = differenceInMilliseconds(endOfDay, currentTime);
  if (lastGapDuration >= ONE_HOUR_IN_MS) {
    freeSlots.push({
      startTime: new Date(currentTime),
      duration: lastGapDuration,
    });
  }

  return freeSlots;
};

// Function to create task in first available free slot with hotkey
export const createTaskInFreeSlotWithHotkey = (values: {
  title: string;
  notes?: string;
  emoji?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
  subtasks?: any[];
}) => {
  const freeSlots = findFreeSlots(tasksStore.state.selectedDate);

  if (freeSlots.length === 0) {
    return null;
  }

  // Find the first slot that's at least 1 hour long
  const suitableSlot = freeSlots.find((slot) => slot.duration >= ONE_HOUR_IN_MS);

  if (!suitableSlot) {
    return null;
  }

  const startTime = format(suitableSlot.startTime, 'HH:mm');
  const endTime = format(addMilliseconds(suitableSlot.startTime, ONE_HOUR_IN_MS), 'HH:mm');

  return createNewTask({
    ...values,
    startTime,
    dueTime: endTime,
    duration: ONE_HOUR_IN_MS,
  });
};
