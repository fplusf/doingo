import { Task } from '@/store/tasks.store';

export const ONE_HOUR_IN_MS = 3600000; // 1 hour in milliseconds
export const CARD_MARGIN_BOTTOM = 30; // margin between cards

export interface DragHandleProps {
  className?: string;
}

export interface SortableTaskItemProps {
  task: Task;
  children: React.ReactNode;
}

export interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export interface CategorySectionProps {
  category: Task['category'];
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
}

export interface DayContentProps {
  ref: React.RefObject<{ setIsCreating: (value: boolean) => void }>;
}
