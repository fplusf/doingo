import { OptimalTask } from '@/features/tasks/types';
import { StorageAdapter } from './storage-adapter';

const TASKS_STORAGE_KEY = 'optimal-adhd-tasks';

export class LocalStorageAdapter implements StorageAdapter {
  getTasks(): OptimalTask[] {
    try {
      const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
      if (!tasksJson) return [];

      const tasks = JSON.parse(tasksJson);

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

          return {
            ...task,
            startTime,
            nextStartTime,
            dueDate,
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
}
