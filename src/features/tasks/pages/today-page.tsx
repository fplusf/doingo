import { useSidebar } from '@/shared/components/ui/sidebar';
import { useEffect, useRef } from 'react';
import { cn } from '../../../lib/utils';
import { TasksList } from '../components/list/tasks-list';
import { WeekNavigator } from '../components/weekly-calendar/week-navigator';

export default function TodayPage() {
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

  // Don't add any code here that would reset scroll position
  // Let the router handle scroll restoration

  return (
    <div
      className={cn(
        'flex h-[calc(100vh-4rem)] bg-sidebar transition-all duration-100',
        'flex-col text-white',
      )}
    >
      {/* Week Navigator */}
      <div className="borderbg-background flex-1 rounded-t-2xl">
        <WeekNavigator className="border-secondary-500 rounded-t-2xl border-b" />
      </div>
      {/* Day Content */}
      <div className="h-full bg-background pb-4 shadow-[0_4px_10px_-4px_rgba(0,0,0,0.1)]">
        <TasksList ref={dayContentRef} />
      </div>
    </div>
  );
}
