import { OptimalTask } from '@/features/tasks/types/task.types';
import { format } from 'date-fns';
import { StorageAdapter } from './storage-adapter';

const TASKS_STORAGE_KEY = 'optimal-adhd-tasks';

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private prefix: string = 'optimal-adhd') {}

  // Tasks specific methods
  getTasks(): OptimalTask[] {
    try {
      const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
      if (!tasksJson) return [];

      const tasks = JSON.parse(tasksJson);
      const today = format(new Date(), 'yyyy-MM-dd');

      // Convert date strings back to Date objects
      return tasks
        .map((task: any) => {
          // Validate dates before creating Date objects
          const startTime = task.startTime ? new Date(task.startTime) : new Date();
          const nextStartTime = task.nextStartTime ? new Date(task.nextStartTime) : new Date();
          const dueDate = task.dueDate ? new Date(task.dueDate) : undefined;

          // Verify that the dates are valid
          if (isNaN(startTime.getTime())) {
            console.warn('Invalid startTime for task:', task.id);
            return null;
          }
          if (isNaN(nextStartTime.getTime())) {
            console.warn('Invalid nextStartTime for task:', task.id);
            return null;
          }
          if (dueDate && isNaN(dueDate.getTime())) {
            console.warn('Invalid dueDate for task:', task.id);
            return null;
          }

          // Ensure all tasks have a taskDate, defaulting to today if missing
          return {
            ...task,
            startTime,
            nextStartTime,
            dueDate,
            taskDate: task.taskDate || today,
          };
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Error reading tasks from localStorage:', error);
      return [];
    }
  }

  saveTasks(tasks: OptimalTask[]): void {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(TASKS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing tasks from localStorage:', error);
    }
  }

  // Generic methods for other features to use
  getItem<T>(key: string): T | null {
    try {
      const itemJson = localStorage.getItem(`${this.prefix}-${key}`);
      return itemJson ? JSON.parse(itemJson) : null;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return null;
    }
  }

  saveItem<T>(key: string, data: T): void {
    try {
      localStorage.setItem(`${this.prefix}-${key}`, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }

  clearItems(keys: string[]): void {
    try {
      keys.forEach((key) => {
        localStorage.removeItem(`${this.prefix}-${key}`);
      });
    } catch (error) {
      console.error('Error clearing items from localStorage:', error);
    }
  }
}
