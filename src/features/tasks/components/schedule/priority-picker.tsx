import { TaskPriority } from '@/features/tasks/types';
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

interface PrioritySelectProps {
  value: TaskPriority;
  onValueChange: (value: TaskPriority) => void;
  className?: string;
}

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

export function PriorityPicker({ value, onValueChange, className }: PrioritySelectProps) {
  const selectedPriority = priorities.find((p) => p.value === value) ?? priorities[3]; // Default to lowest priority

  return (
    <TooltipProvider>
      <Tooltip>
        <Select
          value={value}
          onValueChange={(value: string) => onValueChange(value as TaskPriority)}
        >
          <TooltipTrigger asChild>
            <SelectTrigger className={cn('h-8 w-[40px] justify-center px-0', className)}>
              <div className="flex items-center justify-center">{selectedPriority.icon}</div>
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
          <p className={cn('font-medium')}>{selectedPriority.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
