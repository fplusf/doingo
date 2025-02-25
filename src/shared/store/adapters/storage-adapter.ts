import { OptimalTask } from '../../../features/tasks/types';

export interface StorageAdapter {
  getTasks(): OptimalTask[];
  saveTasks(tasks: OptimalTask[]): void;
  clear(): void;
}
