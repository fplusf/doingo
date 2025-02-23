import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { GripVertical } from 'lucide-react';
import { DragHandleProps } from '../../types';

export const DragHandle = ({ className }: DragHandleProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'absolute right-16 top-1/3 mb-2 h-8 w-8 cursor-grab self-start opacity-0 transition-opacity hover:bg-accent/25 active:cursor-grabbing group-hover:opacity-40',
        className,
      )}
    >
      <GripVertical className="h-4 w-4" />
    </Button>
  );
};
