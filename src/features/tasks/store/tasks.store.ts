import { LocalStorageAdapter } from '@/shared/store/adapters/local-storage-adapter';
import { StorageAdapter } from '@/shared/store/adapters/storage-adapter';
import { Store } from '@tanstack/react-store';
import { addMilliseconds, format, parse } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { RepetitionOption } from '../components/schedule/task-scheduler';
import { OptimalTask, TaskCategory, TaskPriority, TasksState } from '../types';

// Initialize the storage adapter (can be easily swapped with a different implementation)
const storageAdapter: StorageAdapter = new LocalStorageAdapter();

// Get today's date as a string in YYYY-MM-DD format
const today = format(new Date(), 'yyyy-MM-dd');

// Initialize store with tasks from storage
export const tasksStore = new Store<TasksState>({
  tasks: storageAdapter.getTasks().map((task) => ({
    ...task,
    taskDate: task.taskDate || today, // Ensure all tasks have a taskDate, defaulting to today
  })),
  selectedDate: today,
  focusedTaskId: null,
  editingTaskId: null,
});

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
  return tasksStore.state.tasks.filter((task) => task.taskDate === date);
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
    const task = state.tasks.find((t) => t.id === id);
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
      tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
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
    tasks: state.tasks.filter((task) => task.id !== id),
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
    const taskToFocus = state.tasks.find((task) => task.id === id);

    // If the task is not for today, don't allow focusing
    if (taskToFocus && taskToFocus.taskDate !== today && isFocused) {
      return state;
    }

    return {
      ...state,
      focusedTaskId: isFocused ? id : null,
      tasks: state.tasks.map((task) => {
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
    tasks: state.tasks.map((task) => {
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
  }));
};

// Scheduling-specific functions
export const updateTaskRepetition = (taskId: string, repetition: RepetitionOption) => {
  updateStateAndStorage((state) => {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return state;

    return {
      ...state,
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, repetition } : t)),
    };
  });
};

export const updateTaskStartDateTime = (taskId: string, date: Date, time: string) => {
  updateStateAndStorage((state) => {
    const task = state.tasks.find((t) => t.id === taskId);
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
      tasks: state.tasks.map((t) =>
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
export const getTaskSchedulingInfo = (taskId: string) => {
  const task = tasksStore.state.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  return {
    startDate: task.startTime || new Date(),
    startTime: task.time?.split('—')[0] || '',
    dueDate: task.dueDate,
    dueTime: task.dueTime || '',
    duration: task.duration || 0,
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
export const getTaskCategoryAndPriority = (taskId: string) => {
  const task = tasksStore.state.tasks.find((t) => t.id === taskId);
  if (!task) return { category: 'work' as TaskCategory, priority: 'medium' as TaskPriority };

  return {
    category: task.category || 'work',
    priority: task.priority || 'medium',
  };
};
