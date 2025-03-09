import { cn } from '@/lib/utils';
import { addDays, eachDayOfInterval, format, isSameDay, startOfWeek } from 'date-fns';

interface CalendarHeaderProps {
  view: 'day' | 'week' | 'month' | 'year';
  currentDate: Date;
}

export default function CalendarHeader({ view, currentDate }: CalendarHeaderProps) {
  if (view === 'day') {
    return (
      <div className="grid grid-cols-1 border-b border-[#3c4043] bg-[#202124]">
        <div className="flex h-16 items-center justify-center font-medium">
          <div className="text-center">
            <div className="text-xs uppercase text-[#e8eaed]">{format(currentDate, 'EEE')}</div>
            <div
              className={cn(
                'mx-auto flex h-10 w-10 items-center justify-center rounded-full',
                isSameDay(currentDate, new Date()) ? 'bg-[#1a73e8] text-white' : '',
              )}
            >
              {format(currentDate, 'd')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'week') {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, 6),
    });

    return (
      <div className="grid grid-cols-7 border-b border-[#3c4043] bg-[#202124]">
        {days.map((day, i) => (
          <div key={i} className="flex h-16 items-center justify-center font-medium">
            <div className="text-center">
              <div className="text-xs uppercase text-[#e8eaed]">{format(day, 'EEE')}</div>
              <div
                className={cn(
                  'mx-auto flex h-10 w-10 items-center justify-center rounded-full',
                  isSameDay(day, new Date()) ? 'bg-[#1a73e8] text-white' : '',
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (view === 'month') {
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return (
      <div className="grid grid-cols-7 border-b border-[#3c4043] bg-[#202124]">
        {daysOfWeek.map((day, i) => (
          <div key={i} className="flex h-10 items-center justify-center font-medium">
            <div className="text-center text-xs text-[#e8eaed]">{day}</div>
          </div>
        ))}
      </div>
    );
  }

  // Year view
  return (
    <div className="border-b border-[#3c4043] bg-[#202124] p-4">
      <h2 className="text-xl font-medium">{format(currentDate, 'yyyy')}</h2>
    </div>
  );
}
