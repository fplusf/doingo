import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/features/tasks/constants/priority-colors';
import { TaskPriority } from '@/features/tasks/types';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

interface PrioritySelectProps {
  value: TaskPriority;
  onValueChange: (value: TaskPriority) => void;
  className?: string;
}

const priorities: { value: TaskPriority; label: string; description: string }[] = [
  {
    value: 'high',
    label: 'Important & Urgent',
    description: 'Do it now',
  },
  {
    value: 'medium',
    label: 'Important & Not Urgent',
    description: 'Schedule it',
  },
  {
    value: 'low',
    label: 'Not Important & Urgent',
    description: 'Delegate it',
  },
  {
    value: 'none',
    label: 'Not Important & Not Urgent',
    description: 'Eliminate it',
  },
];

export function PriorityPicker({ value, onValueChange, className }: PrioritySelectProps) {
  const handlePriorityChange = (newValue: TaskPriority) => {
    onValueChange(newValue);
  };

  return (
    <Select value={value} onValueChange={handlePriorityChange}>
      <SelectTrigger className={cn('h-8 w-[120px] px-2 text-sm', className)}>
        <div className="flex items-center">
          <div
            className="mr-1.5 h-full w-2.5"
            style={{
              backgroundColor: PRIORITY_COLORS[value],
            }}
          />
          <SelectValue>{PRIORITY_LABELS[value]}</SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent align="end">
        <div className="grid grid-cols-2 gap-1 p-1">
          {priorities.map((priority) => (
            <SelectItem
              defaultValue={''}
              key={priority.value}
              value={priority.value}
              className={cn(
                'relative col-span-1 flex cursor-pointer flex-col items-start overflow-hidden rounded-md p-3 hover:bg-accent',
                'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
              )}
            >
              <div
                className="absolute left-0 top-0 h-full w-2.5"
                style={{
                  backgroundColor: PRIORITY_COLORS[priority.value],
                }}
              />

              <div className="mt-2 pl-2 font-medium">{priority.label}</div>
              <div className="pl-2 text-xs text-muted-foreground">{priority.description}</div>
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
}
