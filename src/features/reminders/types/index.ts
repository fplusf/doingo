export type ReminderPriority = 'none' | 'low' | 'medium' | 'high';

export type ReminderCategory = 'personal' | 'work' | 'shopping' | 'health' | 'other';

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: number; // timestamp in milliseconds
  priority: 'low' | 'medium' | 'high' | 'none';
  list: string; // The list that this reminder belongs to
  createdAt: number; // timestamp in milliseconds
  updatedAt: number; // timestamp in milliseconds
  taskId?: string; // Optional: the task this reminder is linked to
}

export interface ReminderFormValues {
  title: string;
  notes?: string;
  dueDate?: Date;
  priority: ReminderPriority;
  category: ReminderCategory;
}

export interface ReminderList {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface RemindersState {
  reminders: Reminder[];
  lists: ReminderList[];
  selectedListId: string | null;
}
