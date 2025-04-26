import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  timeValue?: string;
  isDragging?: boolean;
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, timeValue, isDragging, ...props }, ref) => (
    <SliderPrimitive.Root
      ref={ref}
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary opacity-0">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="relative block h-7 w-5 cursor-grab rounded-md bg-white/90 shadow-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:cursor-grabbing disabled:pointer-events-none disabled:opacity-50">
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex gap-1">
            <div className="h-3.5 w-0.5 rounded-full bg-background" />
            <div className="h-3.5 w-0.5 rounded-full bg-background" />
          </div>
        </div>
        {isDragging && timeValue && (
          <div className="absolute -bottom-5 left-1/2 z-50 -translate-x-1/2 transform rounded bg-gray-900/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
            {timeValue}
          </div>
        )}
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  ),
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
