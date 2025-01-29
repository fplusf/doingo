import DayContent from '../components/focus-calendar/day-content';
import WeekNavigator from '../components/focus-calendar/week-navigator';
import { useSidebar } from '../components/ui/sidebar';
import { cn } from '../lib/utils';
import { useEffect, useRef } from 'react';

export default function FocusPage() {
  const sidebar = useSidebar();
  const dayContentRef = useRef<{ setIsCreating: (value: boolean) => void } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no input/textarea is focused
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        dayContentRef.current?.setIsCreating(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={cn(
        'b flex h-full bg-sidebar transition-all duration-100',
        sidebar.open ? 'w-[calc(100vw-88px)]' : 'w-[calc(100vw-16px)]',
        'flex-col text-white',
      )}
    >
      {/* Week Navigator */}
      <div className="borderbg-background rounded-t-2xl">
        <WeekNavigator className="mb-1 rounded-t-2xl" />
      </div>
      {/* Day Content */}
      <div className="bg-background shadow-[0_4px_10px_-4px_rgba(0,0,0,0.1)]">
        <DayContent ref={dayContentRef} />
      </div>
    </div>
  );
}
