import type { ReactNode } from 'react';

export const ONE_HOUR_IN_MS = 3600000;
export const CARD_MARGIN_BOTTOM = 30;

export type RepetitionOption = 'once' | 'daily' | 'weekly' | 'custom';

export type TaskPriority =
  | 'none'
  | 'high'
  | 'medium'
  | 'low'
  | 'not-urgent-not-important'
  | undefined;
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
  time: string;
  startTime: Date;
  nextStartTime: Date;
  duration: number;
  completed: boolean;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: Date;
  dueTime?: string;
  isFocused: boolean;
  taskDate: string;
  subtasks?: Subtask[];
  progress?: number;
  repetition?: RepetitionOption;
}

export interface TasksState {
  tasks: OptimalTask[];
  selectedDate: string;
  focusedTaskId: string | null;
  editingTaskId: string | null;
  draftTask: Partial<OptimalTask> | null;
  highlightedTaskId: string | null;
}

export interface DragHandleProps {
  className?: string;
}

export interface SortableTaskItemProps {
  task: OptimalTask;
  children: ReactNode;
}

export interface TaskCardProps {
  task: OptimalTask;
  onEdit: (task: OptimalTask) => void;
}

export interface CategorySectionProps {
  category: OptimalTask['category'];
  tasks: OptimalTask[];
  onAddTask: (startTime?: Date) => void;
  onEditTask: (task: OptimalTask) => void;
  overlaps: Map<string, boolean>;
  highlightedTaskId: string | null;
}

export interface DayContentProps {
  ref: React.RefObject<{ setIsCreating: (value: boolean) => void }>;
}
