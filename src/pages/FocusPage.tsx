import DayContent from '../components/focus-calendar/day-content';
import WeekNavigator from '../components/focus-calendar/week-navigator';
import { useSidebar } from '../components/ui/sidebar';
import { cn } from '../lib/utils';

export default function FocusPage() {
  const sidebar = useSidebar();

  return (
    <div
      className={cn(
        'flex h-full bg-sidebar transition-all duration-100',
        sidebar.open ? 'w-[calc(100vw-88px)]' : 'w-[calc(100vw-16px)]',
        'flex-col text-white',
      )}
    >
      {/* Week Navigator */}
      <div className="bg-sidebar">
        <WeekNavigator className="mb-4 rounded-t-2xl bg-sidebar" />
      </div>
      {/* Day Content */}
      <div className="rounded-t-2xl bg-background shadow-[0_4px_10px_-4px_rgba(0,0,0,0.1)]">
        <DayContent />
      </div>
    </div>
  );
}
