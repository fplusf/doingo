import { DatePicker } from '@/components/calendar/header-calendar';
import { Button } from '@/components/ui/button';
import { useWeekNavigation } from '@/features/tasks/hooks/use-week-navigation';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DragWindowRegion } from '../../components/drag-window-region';

export function DefaultHeader() {
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
