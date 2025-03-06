import { setSelectedList } from '@/features/reminders/store/reminders.store';
import { ReminderList } from '@/features/reminders/types';
import { cn } from '@/lib/utils';
import * as React from 'react';

interface ReminderListItemProps {
  list: ReminderList;
  isActive: boolean;
  count: number;
}

export const ReminderListItem = React.forwardRef<HTMLLIElement, ReminderListItemProps>(
  ({ list, isActive, count, ...props }, ref) => {
    const handleClick = () => {
      setSelectedList(list.id);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setSelectedList(list.id);
      }
    };

    return (
      <li
        ref={ref}
        className={cn(
          'flex cursor-pointer items-center justify-between rounded-md px-3 py-2',
          isActive ? 'bg-primary/10' : 'hover:bg-muted',
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label={`${list.name} list with ${count} reminders`}
        role="button"
        {...props}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: list.color }}
            aria-hidden="true"
          />
          <span className="text-sm font-medium">{list.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">{count}</span>
      </li>
    );
  },
);
