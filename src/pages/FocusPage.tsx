import DayContent from '../components/focus-calendar/day-content';
import WeekNavigator from '../components/focus-calendar/week-navigator';
import { useSidebar } from '../components/ui/sidebar';
import { cn } from '../lib/utils';

export default function FocusPage() {
  const sidebar = useSidebar();

  return (
    <div
      className={cn(
        'flex h-full transition-all duration-100',
        sidebar.open ? 'w-[calc(100vw-6rem)]' : 'w-[calc(100vw-2rem)]',
        'flex-col text-white',
      )}
    >
      {/* Week Navigator */}
      <WeekNavigator className="mb-24 rounded-t-2xl" />

      {/* Day Content */}
      <DayContent />
    </div>
  );
}
