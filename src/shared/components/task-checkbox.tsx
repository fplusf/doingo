import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import React from 'react';
import { useTaskHistory } from '../../features/tasks/hooks/useTaskHistory';
import { tasksStore } from '../../features/tasks/stores/tasks.store';

interface TaskCheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  playSound?: boolean;
  soundSrc?: string;
  ariaLabel?: string;
  'data-task-id'?: string;
}

export const TaskCheckbox = React.forwardRef<HTMLButtonElement, TaskCheckboxProps>(
  (
    {
      checked = false,
      onCheckedChange,
      className,
      size = 'md',
      color = '#3b82f6',
      playSound = true,
      soundSrc = '/complete-task.mp3',
      ariaLabel = 'Toggle task completion',
      'data-task-id': taskId,
    },
    ref,
  ) => {
    const { addCompleteTaskAction } = useTaskHistory();

    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const iconSizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-3.5 w-3.5',
      lg: 'h-4 w-4',
    };

    const handleCheckedChange = (newChecked: boolean) => {
      if (taskId) {
        const task = tasksStore.state.tasks.find((t) => t.id === taskId);

        if (task) {
          const taskBeforeToggle = { ...task };

          if (onCheckedChange) {
            onCheckedChange(newChecked);

            if (newChecked && playSound) {
              const audio = new Audio(soundSrc);
              audio.play().catch(console.error);
            }
          }

          addCompleteTaskAction(taskId, taskBeforeToggle);
          return;
        }
      }

      if (onCheckedChange) {
        onCheckedChange(newChecked);
        if (newChecked && playSound) {
          const audio = new Audio(soundSrc);
          audio.play().catch(console.error);
        }
      }
    };

    return (
      <button
        type="button"
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          handleCheckedChange(!checked);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            handleCheckedChange(!checked);
          }
        }}
        className={cn(
          'flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-400 outline-none ring-0 transition-colors hover:border-green-500 focus:outline-none focus:ring-green-500',
          checked ? 'border-green-500 bg-green-500' : 'border-gray-400 bg-background',
          sizeClasses[size],
          className,
        )}
        role="checkbox"
        aria-checked={checked}
        aria-label={ariaLabel}
        tabIndex={0}
        data-task-id={taskId}
      >
        <Check
          className={cn(
            iconSizeClasses[size],
            checked ? 'text-white opacity-100' : 'text-gray-400 opacity-80 hover:text-green-500',
          )}
        />
      </button>
    );
  },
);

TaskCheckbox.displayName = 'TaskCheckbox';
