import { LocalStorageAdapter } from '@/shared/store/adapters/local-storage-adapter';
import { StorageAdapter } from '@/shared/store/adapters/storage-adapter';
import { Store } from '@tanstack/react-store';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { OptimalTask, TasksState } from '../types';

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
  updateStateAndStorage((state) => ({
    ...state,
    tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
  }));
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
