import { getNextFifteenMinuteInterval } from '@/shared/helpers/date/next-feefteen-minutes';
import { LocalStorageAdapter } from '@/shared/store/adapters/local-storage-adapter';
import { StorageAdapter } from '@/shared/store/adapters/storage-adapter';
import { Store } from '@tanstack/react-store';
import { addMilliseconds, format, parse, parseISO, startOfDay } from 'date-fns';
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
  draftTask: null,
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
    draftTask: null,
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

// Function to get current task scheduling info for the scheduler component
export const getTaskSchedulingInfo = (taskId: string | 'draft') => {
  if (taskId === 'draft') {
    const draftTask = tasksStore.state.draftTask;
    if (!draftTask) return null;

    return {
      startDate: draftTask.startTime || startOfDay(new Date()),
      startTime: draftTask.time?.split('—')[0] || '',
      dueDate: draftTask.dueDate,
      dueTime: draftTask.dueTime || '',
      duration: draftTask.duration || 60 * 60 * 1000,
      repetition: (draftTask.repetition as RepetitionOption) || 'once',
    };
  }

  const task = tasksStore.state.tasks.find((t: OptimalTask) => t.id === taskId);
  if (!task) return null;

  return {
    startDate: task.startTime || startOfDay(new Date()),
    startTime: task.time?.split('—')[0] || '',
    dueDate: task.dueDate,
    dueTime: task.dueTime || '',
    duration: task.duration || 60 * 60 * 1000,
    repetition: (task.repetition as RepetitionOption) || 'once',
  };
};

// Function to update task priority
export const updateTaskPriority = (taskId: string, priority: TaskPriority) => {
  updateStateAndStorage((state) => {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return state;

    return {
      ...state,
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, priority } : t)),
    };
  });
};

// Function to update task category
export const updateTaskCategory = (taskId: string, category: TaskCategory) => {
  updateStateAndStorage((state) => {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return state;

    return {
      ...state,
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, category } : t)),
    };
  });
};

// Function to get task's current category and priority
export const getTaskCategoryAndPriority = (taskId: string | 'draft') => {
  if (taskId === 'draft') {
    const draftTask = tasksStore.state.draftTask;
    if (!draftTask) return { category: 'work' as TaskCategory, priority: 'medium' as TaskPriority };

    return {
      category: (draftTask.category as TaskCategory) || 'work',
      priority: (draftTask.priority as TaskPriority) || 'medium',
    };
  }

  const task = tasksStore.state.tasks.find((t: OptimalTask) => t.id === taskId);
  if (!task) return { category: 'work' as TaskCategory, priority: 'medium' as TaskPriority };

  return {
    category: task.category || 'work',
    priority: task.priority || 'medium',
  };
};

// Draft task management
export const createDraftTask = () => {
  // Create a new draft task with default values
  const now = new Date();
  const startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  tasksStore.setState((state) => ({
    ...state,
    draftTask: {
      title: '',
      emoji: '',
      time: startTime,
      startTime: now,
      nextStartTime: addMilliseconds(now, 60 * 60 * 1000), // 1 hour later
      duration: 60 * 60 * 1000, // Default 1 hour
      completed: false,
      priority: 'medium' as TaskPriority,
      category: 'work' as TaskCategory,
      isFocused: false,
      taskDate: format(now, 'yyyy-MM-dd'),
      progress: 0,
      repetition: 'once' as RepetitionOption,
    },
  }));
};

export const updateDraftTaskField = <K extends keyof OptimalTask>(
  field: K,
  value: OptimalTask[K],
) => {
  tasksStore.setState((state) => {
    if (!state.draftTask) return state;

    return {
      ...state,
      draftTask: {
        ...state.draftTask,
        [field]: value,
      },
    };
  });
};

export const clearDraftTask = () => {
  tasksStore.setState((state) => ({
    ...state,
    draftTask: null,
  }));
};

// Creates a fresh draft task with default values, replacing any existing draft
export const resetDraftTask = () => {
  const now = new Date();
  const startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // First clear any existing draft completely
  tasksStore.setState((state) => ({
    ...state,
    draftTask: null,
  }));

  // Then create a fresh draft with default values
  tasksStore.setState((state) => ({
    ...state,
    draftTask: {
      // Explicitly set all fields to their default values
      id: 'draft',
      title: '',
      emoji: '',
      time: startTime,
      startTime: now,
      nextStartTime: addMilliseconds(now, 60 * 60 * 1000), // 1 hour later
      duration: 60 * 60 * 1000, // Default 1 hour
      completed: false,
      priority: 'medium' as TaskPriority,
      category: 'work' as TaskCategory,
      isFocused: false,
      taskDate: format(now, 'yyyy-MM-dd'),
      progress: 0,
      repetition: 'once' as RepetitionOption,
      dueDate: undefined,
      dueTime: '',
      notes: '',
      subtasks: [],
    },
  }));

  console.log('Draft task has been reset to default values with empty title');
};

// Update draft task schedule functions
export const updateDraftTaskRepetition = (repetition: RepetitionOption) => {
  tasksStore.setState((state) => {
    if (!state.draftTask) return state;

    return {
      ...state,
      draftTask: {
        ...state.draftTask,
        repetition,
      },
    };
  });
};

export const updateDraftTaskStartDateTime = (date: Date, time: string) => {
  tasksStore.setState((state) => {
    if (!state.draftTask) return state;

    // Format taskDate from the provided date
    const taskDate = format(date, 'yyyy-MM-dd');

    // Parse the start time
    const startTime = parse(time, 'HH:mm', date);

    // Update time string - preserve due time if it exists
    let timeString = time;
    if (state.draftTask.time && state.draftTask.time.includes('—')) {
      const timeParts = state.draftTask.time.split('—');
      if (timeParts.length > 1) {
        timeString = `${time}—${timeParts[1]}`;
      }
    }

    // Calculate next start time based on current duration
    const duration = state.draftTask.duration || 60 * 60 * 1000;
    const nextStartTime = addMilliseconds(startTime, duration);

    return {
      ...state,
      draftTask: {
        ...state.draftTask,
        taskDate,
        startTime,
        nextStartTime,
        time: timeString,
      },
    };
  });
};

export const updateDraftTaskDueDateTime = (date: Date, time: string) => {
  console.log('updateDraftTaskDueDateTime called with:', { date, time });

  if (!tasksStore.state.draftTask) {
    console.warn('No draft task exists for due date update');
    return;
  }

  // Validate the date is a proper Date object
  const safeDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();

  tasksStore.setState((state) => {
    if (!state.draftTask) return state;

    // Update time string - preserve start time
    let timeString = state.draftTask.time || '';
    if (timeString.includes('—')) {
      const timeParts = timeString.split('—');
      timeString = `${timeParts[0]}—${time}`;
    } else if (timeString) {
      timeString = `${timeString}—${time}`;
    } else {
      // If no time string exists yet, just set the due time
      timeString = `—${time}`;
    }

    const updatedDraft = {
      ...state.draftTask,
      dueDate: safeDate,
      dueTime: time,
      time: timeString,
    };

    console.log('Updated draft with due date/time:', updatedDraft);

    return {
      ...state,
      draftTask: updatedDraft,
    };
  });

  // Verify the update
  setTimeout(() => {
    console.log('Draft immediately after due date update:', tasksStore.state.draftTask);
  }, 10);
};

export const updateDraftTaskDuration = (durationMs: number) => {
  console.log('updateDraftTaskDuration called with:', { durationMs });

  if (!tasksStore.state.draftTask) {
    console.warn('No draft task exists for duration update');
    return;
  }

  // Ensure we're working with a number for the duration
  const safeValue =
    typeof durationMs === 'number' && !isNaN(durationMs) ? durationMs : 60 * 60 * 1000;

  tasksStore.setState((state) => {
    if (!state.draftTask) return state;

    // Calculate the new next start time based on the start time and new duration
    const nextStartTime = state.draftTask.startTime
      ? addMilliseconds(state.draftTask.startTime as Date, safeValue)
      : addMilliseconds(new Date(), safeValue);

    const updatedDraft = {
      ...state.draftTask,
      duration: safeValue,
      nextStartTime,
    };

    console.log('Updated draft with duration:', updatedDraft);

    return {
      ...state,
      draftTask: updatedDraft,
    };
  });

  // Verify the update
  setTimeout(() => {
    console.log('Draft immediately after duration update:', tasksStore.state.draftTask);
  }, 10);
};

export const updateDraftTaskCategory = (category: TaskCategory) => {
  updateDraftTaskField('category', category);
};

export const updateDraftTaskPriority = (priority: TaskPriority) => {
  updateDraftTaskField('priority', priority);
};

// Convert draft task to a real task and add it to the list
export const createTaskFromDraft = () => {
  let newTaskId = '';

  console.log('Draft before creating task:', tasksStore.state.draftTask);

  if (!tasksStore.state.draftTask) {
    console.error('Attempted to create task from non-existent draft');
    return '';
  }

  const draftTask = tasksStore.state.draftTask;

  // Pre-validate essential fields
  const duration =
    typeof draftTask.duration === 'number' && !isNaN(draftTask.duration)
      ? draftTask.duration
      : 60 * 60 * 1000;

  const dueDate =
    draftTask.dueDate instanceof Date && !isNaN(draftTask.dueDate?.getTime?.())
      ? draftTask.dueDate
      : undefined;

  console.log('Pre-validated fields:', { duration, dueDate });

  tasksStore.setState((state) => {
    if (!state.draftTask) return state;

    // Generate an ID for the new task
    newTaskId = uuidv4();

    const currentDate = new Date();
    const taskDate = state.draftTask.taskDate || format(currentDate, 'yyyy-MM-dd');
    const startTimeDate = state.draftTask.startTime
      ? new Date(state.draftTask.startTime)
      : currentDate;
    const nextStartTimeDate = state.draftTask.nextStartTime
      ? new Date(state.draftTask.nextStartTime)
      : addMilliseconds(startTimeDate, duration);

    // Create a new task from the draft with validated fields
    const newTask: OptimalTask = {
      id: newTaskId,
      title: state.draftTask.title || '',
      time: state.draftTask.time || '',
      startTime: startTimeDate,
      nextStartTime: nextStartTimeDate,
      duration,
      completed: false,
      priority: (state.draftTask.priority as TaskPriority) || 'medium',
      category: (state.draftTask.category as TaskCategory) || 'work',
      taskDate,
      isFocused: false,
      notes: state.draftTask.notes || '',
      emoji: state.draftTask.emoji || '',
      dueDate: dueDate,
      dueTime: state.draftTask.dueTime || '',
      progress: state.draftTask.progress || 0,
      subtasks: (state.draftTask.subtasks || []) as Subtask[],
      repetition: (state.draftTask.repetition as RepetitionOption) || 'once',
    };

    console.log('New task being created:', newTask);

    // Add the new task to the list
    const updatedTasks = [...state.tasks, newTask];

    // Save to storage
    storageAdapter.saveTasks(updatedTasks);

    return {
      ...state,
      tasks: updatedTasks,
      draftTask: null, // Clear the draft
    };
  });

  const createdTaskId =
    tasksStore.state.tasks.find((t: OptimalTask) => t.id === newTaskId)?.id ||
    tasksStore.state.tasks[tasksStore.state.tasks.length - 1].id;
  console.log('Created task ID:', createdTaskId);

  // Log the created task to verify duration and dueDate
  const createdTask = tasksStore.state.tasks.find((t: OptimalTask) => t.id === createdTaskId);
  console.log('Created task:', createdTask);

  return createdTaskId;
};

// Helper functions for time management
export const getDefaultStartTime = () => {
  const nextFifteen = getNextFifteenMinuteInterval();
  return format(nextFifteen, 'HH:mm');
};

export const getDefaultEndTime = () => {
  const nextFifteen = getNextFifteenMinuteInterval();
  return format(addMilliseconds(nextFifteen, ONE_HOUR_IN_MS), 'HH:mm');
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
