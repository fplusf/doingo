export const ONE_HOUR_IN_MS = 3600000; // 1 hour in milliseconds
export const CARD_MARGIN_BOTTOM = 30; // margin between cards

export interface DragHandleProps {
  className?: string;
}

export interface SortableTaskItemProps {
  task: OptimalTask;
  children: React.ReactNode;
}

export interface TaskCardProps {
  task: OptimalTask;
  onEdit: (task: OptimalTask) => void;
}

export interface CategorySectionProps {
  category: OptimalTask['category'];
  tasks: OptimalTask[];
  onAddTask: () => void;
  onEditTask: (task: OptimalTask) => void;
}

export interface DayContentProps {
  ref: React.RefObject<{ setIsCreating: (value: boolean) => void }>;
}

export type TaskPriority = 'none' | 'high' | 'medium' | 'low' | 'not-urgent-not-important' | '';
export type TaskCategory = 'work' | 'passion' | 'play';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface OptimalTask {
  id: string;
  title: string;
  notes?: string;
  emoji?: string;
  time: string; // Human readable format for display
  startTime: Date;
  endTime?: Date; // End time based on start time + duration
  nextStartTime: Date;
  duration: number; // Duration in milliseconds
  completed: boolean;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: Date;
  isFocused: boolean;
  taskDate: string; // ISO format date string (YYYY-MM-DD) for filtering tasks by day
  subtasks?: Subtask[];
  progress?: number; // Percentage of completed subtasks (0-100)
  // canvasData?: string; // Serialized Excalidraw scene data
}

export interface TasksState {
  tasks: OptimalTask[];
  selectedDate: string; // ISO format date string (YYYY-MM-DD)
}
