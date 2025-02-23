import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/shared/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  size?: 'default' | 'small';
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  size = 'default',
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-0', size === 'small' ? 'p-4 text-sm' : '', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 gap-3',
        month: 'space-y-3',
        caption: 'flex justify-center relative items-center',
        caption_label: cn('text-sm font-medium', size === 'small' && 'text-xs'),
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          size === 'small' ? 'h-5 w-5' : 'h-7 w-7',
          'bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-2',
        head_row: 'flex',
        head_cell: cn(
          'text-muted-foreground rounded-md w-9 font-normal',
          size === 'small' ? 'w-7 text-[0.65rem] p-1.5' : 'w-9 text-[0.8rem]',
        ),
        row: 'flex w-full mt-2',
        cell: cn(
          'text-center p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
          size === 'small' ? 'h-7 w-7 text-[0.7rem] p-0.5' : 'h-9 w-9 text-sm',
        ),
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          size === 'small' ? 'h-7 w-7' : 'h-9 w-9',
          'p-0 font-normal aria-selected:opacity-100',
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'border-2 border-primary bg-transparent text-foreground hover:bg-accent/50 hover:text-foreground focus:bg-accent/50 focus:text-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside:
          'day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft
            className={cn(size === 'small' ? 'h-2.5 w-2.5' : 'h-4 w-4', className)}
            {...props}
          />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight
            className={cn(size === 'small' ? 'h-2.5 w-2.5' : 'h-4 w-4', className)}
            {...props}
          />
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
