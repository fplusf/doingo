import { Task } from '../../../features/tasks/store/tasks.store';

export interface StorageAdapter {
  getTasks(): Task[];
  saveTasks(tasks: Task[]): void;
  clear(): void;
}
