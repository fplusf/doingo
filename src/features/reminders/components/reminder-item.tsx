import {
  deleteReminder,
  toggleReminderCompletion,
} from '@/features/reminders/store/reminders.store';
import { Reminder } from '@/features/reminders/types';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import * as React from 'react';

interface ReminderItemProps {
  reminder: Reminder;
  onClick?: (reminder: Reminder) => void;
}

export const ReminderItem = ({ reminder, onClick }: ReminderItemProps) => {
  const navigate = useNavigate();

  const handleCheckboxChange = (checked: boolean) => {
    toggleReminderCompletion(reminder.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteReminder(reminder.id);
  };

  const handleClick = () => {
    if (reminder.taskId) {
      navigate({ to: '/tasks/$taskId', params: { taskId: reminder.taskId } });
    } else if (onClick) {
      onClick(reminder);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onClick) onClick(reminder);
    }
  };

  return (
    <div
      className={cn(
        'group flex cursor-pointer items-center justify-between rounded-md px-4 py-3',
        'transition-all duration-200 hover:bg-muted',
        reminder.completed && 'opacity-60',
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Reminder: ${reminder.title}`}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          id={`reminder-${reminder.id}`}
          checked={reminder.completed}
          onCheckedChange={handleCheckboxChange}
          className={cn(
            'h-5 w-5 rounded-full',
            reminder.priority === 'high' && 'border-red-500',
            reminder.priority === 'medium' && 'border-yellow-500',
            reminder.priority === 'low' && 'border-blue-500',
          )}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex flex-col">
          <span
            className={cn(
              'text-sm font-medium',
              reminder.completed && 'text-muted-foreground line-through',
            )}
          >
            {reminder.title}
          </span>
          {reminder.description && (
            <span className="line-clamp-1 text-xs text-muted-foreground">
              {reminder.description}
            </span>
          )}
          {reminder.dueDate && (
            <span
              className={cn(
                'text-xs',
                new Date(reminder.dueDate) < new Date() && !reminder.completed
                  ? 'text-red-500'
                  : 'text-muted-foreground',
              )}
            >
              {format(reminder.dueDate, 'MMM d, yyyy')}
            </span>
          )}
        </div>
      </div>
      <button
        className="text-destructive opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        onClick={handleDelete}
        aria-label="Delete reminder"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};
