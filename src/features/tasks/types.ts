export const ONE_HOUR_IN_MS = 60 * 60 * 1000;

export type TaskPriority = 'none' | 'low' | 'medium' | 'high';
export type TaskCategory = 'work' | 'passion' | 'play';

export interface OptimalTask {
  id: string;
  title: string;
  emoji?: string;
  time?: string;
  dueTime?: string;
  dueDate?: Date;
  duration?: number;
  priority?: TaskPriority;
  category?: TaskCategory;
  completed?: boolean;
  notes?: string;
  subtasks?: string[];
  progress?: number;
  taskDate?: string;
  overlapsWithNext?: boolean;
}

export interface CategorySectionProps {
  category: TaskCategory;
  tasks: OptimalTask[];
  onAddTask: () => void;
  onEditTask: (task: OptimalTask) => void;
  overlaps: Map<string, boolean>;
}
