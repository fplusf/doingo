import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import TaskInput from './input';
import { TaskPriority, TaskCategory } from '@/store/tasks.store';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: {
    title: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    duration?: string;
    dueDate?: Date;
    priority?: TaskPriority;
    category?: TaskCategory;
  };
  onSubmit: (values: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    duration: string;
    dueDate?: Date;
    priority: TaskPriority;
    category: TaskCategory;
  }) => void;
  mode?: 'create' | 'edit';
  className?: string;
}

export function TaskDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  mode = 'create',
  className,
}: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-[0_0_30px_rgba(0,0,0,0.15)] dark:shadow-[0_0_30px_rgba(0,0,0,0.3)]',
          className,
        )}
      >
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Task' : 'Edit Task'}</DialogTitle>
        </DialogHeader>
        <TaskInput
          initialValues={initialValues}
          onSubmit={(values) => {
            onSubmit(values);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
          submitLabel={mode === 'create' ? 'Add task' : 'Save changes'}
          className="border-none p-0 shadow-none"
        />
      </DialogContent>
    </Dialog>
  );
}
