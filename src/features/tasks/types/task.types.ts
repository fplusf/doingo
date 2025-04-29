import type { ReactNode } from 'react';

export const ONE_HOUR_IN_MS = 3600000;
export const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;
export const TWENTY_MINUTES_IN_MS = 20 * 60 * 1000;
export const CARD_MARGIN_BOTTOM = 30;

export type RepetitionType = 'once' | 'daily' | 'weekly' | 'monthly';
export type RepetitionOption = {
  type: RepetitionType;
  repeatInterval?: number;
  repeatStartDate?: Date;
  repeatEndDate?: Date;
};

export type TaskPriority = 'none' | 'high' | 'medium' | 'low' | undefined;
export type TaskCategory = 'work' | 'passion' | 'play';

export type GapType = 'break' | 'free-slot' | 'get-ready' | 'idle-time';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  order?: number;
}

// Timer state for each task
export interface TimerState {
  isRunning: boolean;
  lastUpdatedAt: number;
}

export interface OptimalTask {
  id: string;
  title: string;
  notes?: string;
  emoji?: string;
  time?: string;
  duration?: number;
  dueDate?: Date;
  dueTime?: string;
  priority: TaskPriority;
  category: TaskCategory;
  completed: boolean;
  isFocused: boolean;
  taskDate: string;
  subtasks: Subtask[];
  progress: number;
  startTime?: Date;
  nextStartTime?: Date;
  repetition?: RepetitionOption;
  // Multi-day task properties
  isPartOfMultiDay?: boolean;
  originalTaskId?: string;
  multiDaySequence?: number;
  multiDaySetId?: string;
  isFirstDayOfSet?: boolean;
  isLastDayOfSet?: boolean;
  // Gap-specific properties
  isGap?: boolean;
  gapType?: GapType;
  gapStartTime?: Date;
  gapEndTime?: Date;
  timeSpent: number; // Total time spent on task in milliseconds
  // Next day indicator
  endsNextDay?: boolean; // Indicates if the task ends on the next day
  // Time-sensitive task indicator
  isTimeFixed?: boolean; // Indicates if the task's time is fixed and shouldn't be adjusted by overlap resolvers
}

export interface TaskHistoryEntry {
  taskId: string;
  previousState: OptimalTask;
  timestamp: number;
  action: 'focus' | 'edit' | 'move';
}

export interface TasksState {
  tasks: OptimalTask[];
  selectedDate: string;
  focusedTaskId: string | null;
  editingTaskId: string | null;
  highlightedTaskId: string | null;
  taskHistory: TaskHistoryEntry[];
  timerStates: Record<string, TimerState>; // Map of task IDs to timer states
  resizingState: {
    taskId: string | null;
    temporaryDuration: number | null;
    temporaryEndTime: Date | null;
  };
  lastUpdate: number; // Timestamp for forcing recalculation of derived state
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
  effectiveDuration?: number;
  listeners?: Record<string, any>;
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
