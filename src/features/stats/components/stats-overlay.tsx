import { Dialog, DialogClose, DialogContent } from '@/shared/components/ui/dialog';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import StatsOverview from './stats-overview';

export function StatsOverlay() {
  const navigate = useNavigate();

  const handleClose = () => {
    // Navigate to clear overlay-related search params
    navigate({
      to: '/tasks',
      search: {
        overlay: undefined,
      },
    });
  };

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="h-[70vh] max-h-none w-[70vw] max-w-none"
        overlayClassName="bg-black/60"
      >
        <DialogClose asChild>
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm text-muted-foreground opacity-70 ring-offset-background transition-opacity hover:text-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close"
          >
            ×
          </button>
        </DialogClose>
        <StatsOverview />
      </DialogContent>
    </Dialog>
  );
}
