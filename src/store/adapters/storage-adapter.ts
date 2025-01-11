import { Task } from '../tasks.store';

export interface StorageAdapter {
  getTasks(): Task[];
  saveTasks(tasks: Task[]): void;
  clear(): void;
}
