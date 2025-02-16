import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import TaskInput, { TaskFormValues, TaskInputRef } from './input';
import { useRef } from 'react';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormValues) => void;
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
  const formRef = useRef<TaskInputRef>(null);

  const handleSubmitAndClose = (values: TaskFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (formRef.current) {
      const values = formRef.current.getFormValues();
      if (values) {
        onSubmit(values);
      }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        overlayClassName="bg-black/10"
        onEscapeKeyDown={handleClose}
        onPointerDownOutside={handleClose}
        onInteractOutside={handleClose}
        className={cn(
          'fixed left-1/2 top-[50%] z-50 w-full max-w-full -translate-x-1/2 -translate-y-1/2 rounded-lg border border-none border-zinc-800 bg-card p-6 text-zinc-400 shadow-[0_0_30px_rgba(0,0,0,0.8)] duration-75 dark:shadow-[0_0_30px_rgba(0,0,0,0.8)] sm:max-w-2xl',
          className,
        )}
      >
        <DialogHeader className="absolute -top-10 rounded-md border border-gray-700 bg-card p-2 text-sm">
          <DialogTitle className="text-xs">
            {mode === 'create' ? 'Add task' : 'Edit task'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'create' ? 'Add a new task to your timeline' : 'Edit an existing task'}
          </DialogDescription>
        </DialogHeader>

        <TaskInput
          ref={formRef}
          initialValues={initialValues}
          onSubmit={handleSubmitAndClose}
          onCancel={handleClose}
          submitLabel={mode === 'create' ? 'Add task' : 'Save changes'}
          className="border-none p-0 shadow-none"
        />
      </DialogContent>
    </Dialog>
  );
}
