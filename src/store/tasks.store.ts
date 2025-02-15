import { Store } from '@tanstack/react-store';
import { v4 as uuidv4 } from 'uuid';
import { LocalStorageAdapter } from './adapters/local-storage-adapter';
import { StorageAdapter } from './adapters/storage-adapter';

export type TaskPriority = 'high' | 'medium' | 'low' | 'none';
export type TaskCategory = 'work' | 'passion' | 'play';

export interface Task {
  id: string;
  title: string;
  notes?: string;
  emoji?: string;
  time: string; // Human readable format for display
  startTime: Date;
  nextStartTime: Date;
  duration: number; // Duration in milliseconds
  completed: boolean;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: Date;
  canvasData?: string; // Serialized Excalidraw scene data
}

interface TasksState {
  tasks: Task[];
}

// Initialize the storage adapter (can be easily swapped with a different implementation)
const storageAdapter: StorageAdapter = new LocalStorageAdapter();

// Initialize store with tasks from storage
export const tasksStore = new Store<TasksState>({
  tasks: storageAdapter.getTasks(),
});

// Helper function to update state and storage
const updateStateAndStorage = (updater: (state: TasksState) => TasksState) => {
  const newState = updater(tasksStore.state);
  tasksStore.setState(() => newState);
  storageAdapter.saveTasks(newState.tasks);
};

export const addTask = (task: Omit<Task, 'id'>) => {
  updateStateAndStorage((state) => ({
    tasks: [...state.tasks, { ...task, id: uuidv4() }],
  }));
};

export const updateTask = (id: string, updates: Partial<Task>) => {
  updateStateAndStorage((state) => ({
    tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
  }));
};

export const deleteTask = (id: string) => {
  updateStateAndStorage((state) => ({
    tasks: state.tasks.filter((task) => task.id !== id),
  }));
};

export const toggleTaskCompletion = (id: string) => {
  updateStateAndStorage((state) => {
    const tasks = [...state.tasks];
    const taskIndex = tasks.findIndex((task) => task.id === id);
    const task = tasks[taskIndex];

    if (!task) return state;

    // Toggle the completion status
    const updatedTask = { ...task, completed: !task.completed };

    // Remove the task from its current position
    tasks.splice(taskIndex, 1);

    // Find the index of the last completed task in the same category
    const lastCompletedIndex =
      tasks
        .map((t, index) => ({ completed: t.completed, category: t.category, index }))
        .reverse()
        .find((t) => t.completed && t.category === task.category)?.index ??
      tasks.findIndex((t) => t.category === task.category) - 1;

    // Insert after the last completed task in the same category
    tasks.splice(lastCompletedIndex + 1, 0, updatedTask);

    return { tasks };
  });
};

export const clearTasks = () => {
  storageAdapter.clear();
  tasksStore.setState(() => ({ tasks: [] }));
};
