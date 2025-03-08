import { useWeekNavigation } from '@/features/tasks/hooks/use-week-navigation';
import { DatePicker } from '@/layouts/headers/header-calendar';
import { DragWindowRegion } from '@/shared/components/drag-window-region';
import { Button } from '@/shared/components/ui/button';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function DefaultHeader() {
  // TODO: Use useWeekNavigation is tied to tasks route - and throws error when used in other routes, like this component.
  // which is rendered with the layout for all routes.
  // Need to find a way to use the hook in this component without throwing an error.

  // use native router to get current path
  const currentPath = window.location.pathname;
  const isTasksRoute = currentPath === '/tasks';

  if (!isTasksRoute) {
    return null;
  }

  const { handleNext, handlePrev, navigateToDate } = useWeekNavigation();
  const date = new Date().toISOString().split('T')[0]; // Get from state if needed

  return (
    <DragWindowRegion>
      {{
        left: () => (
          <div className="ml-12 flex max-w-max">
            <div className="flex items-center justify-center">
              <Button onClick={handlePrev} variant="ghost" size="icon" className="h-7 w-7">
                <ChevronLeft />
              </Button>
              <span
                onClick={() => navigateToDate(new Date())}
                className="mx-2 w-[127px] cursor-pointer text-center"
              >
                {format(new Date(date), 'MMMM yyyy')}
              </span>
              <Button onClick={handleNext} variant="ghost" size="icon" className="h-7 w-7">
                <ChevronRight />
              </Button>
            </div>
          </div>
        ),
        center: () => <div />,
        right: () => (
          <div className="mr-2 py-2">
            <DatePicker />
          </div>
        ),
      }}
    </DragWindowRegion>
  );
}
