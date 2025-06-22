import { cn } from '@/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { ReactNode } from 'react';

interface OverlayProps {
  children: ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export function Overlay({ children, onClose, showCloseButton = true, className }: OverlayProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Default behavior: clear all overlay-related search params
      navigate({
        search: (prev) => ({
          ...prev,
          taskId: undefined,
          tab: undefined,
          overlay: undefined,
        }),
      });
    }
  };

  return (
    <div className={cn('fixed inset-0 z-40 flex w-full flex-col bg-background', className)}>
      {showCloseButton && (
        <button
          className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Close overlay"
          onClick={handleClose}
        >
          ✕
        </button>
      )}
      {children}
    </div>
  );
}
