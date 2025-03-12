import { OptimalTask } from '@/features/tasks/types/task.types';

export interface StorageAdapter {
  // Tasks specific methods
  getTasks(): OptimalTask[];
  saveTasks(tasks: OptimalTask[]): void;
  clear(): void;

  // Generic methods for other features to use
  getItem<T>(key: string): T | null;
  saveItem<T>(key: string, data: T): void;
  clearItems(keys: string[]): void;
}
