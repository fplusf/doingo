import {
  Toast,
  ToastAction,
  ToastClose,
  ToastProvider,
  ToastViewport,
} from '@/shared/components/ui/toast';
import { useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';

interface TaskMoveToastProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  destinationDate: string | null;
  onViewClick?: () => void;
}

export const TaskMoveToast = ({
  isOpen,
  onOpenChange,
  destinationDate,
  onViewClick,
}: TaskMoveToastProps) => {
  const navigate = useNavigate();

  if (!destinationDate) return null;

  const formattedDate = (() => {
    try {
      // Format date as xx.xx format (day.month)
      return format(new Date(destinationDate), 'dd.MM');
    } catch (error) {
      return destinationDate;
    }
  })();

  // Function to handle navigation to the destination date
  const handleViewDestination = () => {
    // First trigger any cleanup (like closing dialogs)
    if (onViewClick) {
      onViewClick();
    }

    // Then close the toast
    onOpenChange(false);

    // Finally navigate to the destination
    navigate({
      to: '/tasks',
      search: {
        date: destinationDate,
      },
    });
  };

  return (
    <ToastProvider>
      <Toast
        open={isOpen}
        onOpenChange={onOpenChange}
        className="flex h-auto items-center gap-2 border-border border-opacity-20 bg-background/80 p-2 pr-14 backdrop-blur-sm"
      >
        <div className="flex items-center gap-1.5 text-sm">
          <span>Task moved to</span>
          <ArrowRight className="h-3 w-3 opacity-50" />
          <span className="font-medium">{formattedDate}</span>
        </div>
        <ToastClose className="absolute right-2 top-[42%] h-4 w-4 -translate-y-[42%] rounded-sm" />
        <ToastAction
          altText="View task date"
          onClick={handleViewDestination}
          className="ml-auto px-4 py-1 text-xs"
        >
          View
        </ToastAction>
      </Toast>
      <ToastViewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
    </ToastProvider>
  );
};
