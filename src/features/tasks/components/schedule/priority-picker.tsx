import { TaskPriority } from '@/features/tasks/types';
import { predictTaskPriority } from '@/lib/groq-service';
import { cn } from '@/lib/utils';
import {
  NotUrgentImportantIcon,
  NotUrgentNotImportantIcon,
  UrgentImportantIcon,
  UrgentNotImportantIcon,
} from '@/shared/components/custom-icons/priority-icons';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { useState } from 'react';

interface PrioritySelectProps {
  value: TaskPriority;
  onValueChange: (value: TaskPriority) => void;
  className?: string;
  taskTitle?: string;
  isPredicting?: boolean;
}

// Simple RadioButton component
interface RadioButtonProps {
  checked: boolean;
  className?: string;
}

const RadioButton = ({ checked, className }: RadioButtonProps) => (
  <div className={cn('relative h-4 w-4 rounded-full border border-muted-foreground', className)}>
    {checked && (
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
    )}
  </div>
);

const priorities: {
  value: TaskPriority;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'high',
    label: 'Urgent & Important',
    icon: <UrgentImportantIcon className="h-5 w-5 text-red-500" />,
  },
  {
    value: 'medium',
    label: 'Not Urgent & Important',
    icon: <NotUrgentImportantIcon className="h-5 w-5 text-yellow-500" />,
  },
  {
    value: 'low',
    label: 'Urgent & Not Important',
    icon: <UrgentNotImportantIcon className="h-5 w-5 text-blue-500" />,
  },
  {
    value: 'none',
    label: 'Not Urgent & Not Important',
    icon: <NotUrgentNotImportantIcon className="h-5 w-5 text-green-500" />,
  },
];

export function PriorityPicker({
  value,
  onValueChange,
  className,
  taskTitle = '',
  isPredicting = false,
}: PrioritySelectProps) {
  const [suggestedPriority, setSuggestedPriority] = useState<TaskPriority | null>(null);

  // Get the selected priority details (default to the last priority - green one)
  const selectedPriority = priorities.find((p) => p.value === value) ?? priorities[3];

  // Handle requesting AI prediction
  const handleRequestPrediction = async () => {
    if (!taskTitle || taskTitle.trim().length < 3) return;

    try {
      // Use the Groq AI service to predict priority
      const predicted = await predictTaskPriority(taskTitle);
      setSuggestedPriority(predicted);
      onValueChange(predicted);
    } catch (error) {
      console.error('Failed to predict priority:', error);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <div className="flex items-center gap-1">
          <Select
            value={value}
            onValueChange={(value: string) => onValueChange(value as TaskPriority)}
          >
            <TooltipTrigger asChild>
              <SelectTrigger className={cn('h-8 w-[6rem] px-0', className)}>
                <div className="flex w-full items-center justify-between px-2">
                  <span className="text-xs">Priority</span>
                  <span className="text-xs">{selectedPriority.icon}</span>
                </div>
              </SelectTrigger>
            </TooltipTrigger>
            <SelectContent align="end">
              <div className="grid grid-cols-2 gap-0 p-2">
                {priorities.map((priority, index) => (
                  <SelectItem
                    key={priority.value}
                    value={priority.value as string}
                    hideCheck
                    className={cn(
                      'relative col-span-1 flex cursor-pointer flex-col items-start overflow-hidden p-3',
                      'data-[state=checked]:bg-primary/30 data-[state=checked]:text-primary-foreground',
                      index % 2 === 0 ? 'border-r-2 border-background' : '',
                      index < 2 ? 'border-b-2 border-background' : '',
                    )}
                  >
                    <div className="flex items-center gap-2">{priority.icon}</div>
                    <div className={cn('mt-2 text-sm font-medium')}>{priority.label}</div>
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
          <TooltipContent side="bottom" align="center">
            <p className={cn('font-medium')}>
              {selectedPriority.label}
              {suggestedPriority && ' (AI suggested)'}
              {isPredicting && ' (AI analyzing...)'}
            </p>
          </TooltipContent>
        </div>
      </Tooltip>
    </TooltipProvider>
  );
}
