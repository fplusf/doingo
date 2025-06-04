// Helper to sync reminders with task due dates
// Call this after creating or updating a task with a due date
import {
  addReminder,
  deleteReminder,
  getAllReminders,
  updateReminder,
} from '@/features/reminders/store/reminders.store';
import { Reminder } from '@/features/reminders/types';
import { OptimalTask } from '../types/task.types';

export function syncTaskReminder(task: OptimalTask) {
  if (!task.id) return;
  const reminders: Reminder[] = getAllReminders();
  const existing = reminders.find((r) => r.taskId === task.id);
  const dueDateMs = task.dueDate
    ? typeof task.dueDate === 'number'
      ? task.dueDate
      : task.dueDate.getTime()
    : undefined;

  if (dueDateMs) {
    if (existing) {
      // Update if due date or title changed
      if (existing.dueDate !== dueDateMs || existing.title !== task.title) {
        updateReminder(existing.id, {
          dueDate: dueDateMs,
          title: task.title,
          taskId: task.id,
        });
      }
    } else {
      // Create new reminder
      addReminder({
        title: task.title,
        dueDate: dueDateMs,
        completed: false,
        priority: task.priority || 'none',
        list: 'all',
        taskId: task.id,
        description: task.notes || undefined,
      });
    }
  } else if (existing) {
    // No due date, remove reminder
    deleteReminder(existing.id);
  }
}
