import { Task } from '../tasks.store';
import { StorageAdapter } from './storage-adapter';

const TASKS_STORAGE_KEY = 'optimal-adhd-tasks';

export class LocalStorageAdapter implements StorageAdapter {
  getTasks(): Task[] {
    try {
      const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
      if (!tasksJson) return [];

      const tasks = JSON.parse(tasksJson);

      // Convert date strings back to Date objects
      return tasks.map((task: any) => ({
        ...task,
        startTime: new Date(task.startTime),
        nextStartTime: new Date(task.nextStartTime),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      }));
    } catch (error) {
      console.error('Error reading tasks from localStorage:', error);
      return [];
    }
  }

  saveTasks(tasks: Task[]): void {
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
