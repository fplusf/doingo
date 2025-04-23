'use client';

import { cn } from '@/lib/utils';
import { Slider } from '@/shared/components/ui/slider';
import type React from 'react';
import { useState } from 'react';

type SliderProps = React.ComponentProps<typeof Slider>;

export function SliderTimePicker({ className, ...props }: SliderProps) {
  const [time, setTime] = useState<number>(720); // Default to 12:00
  const [isDragging, setIsDragging] = useState(false);

  // Convert minutes to HH:MM format
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Handle slider value change
  const handleValueChange = (value: number[]) => {
    setTime(value[0]);
  };

  // Calculate working hours positions (9:00 - 17:00)
  const workStartMinutes = 9 * 60; // 9:00 = 540 minutes
  const workEndMinutes = 17 * 60; // 17:00 = 1020 minutes
  const totalMinutes = 24 * 60 - 1; // 1439 minutes (max slider value)

  // Calculate percentages for positioning
  const workStartPercent = (workStartMinutes / totalMinutes) * 100;
  const workDurationPercent = ((workEndMinutes - workStartMinutes) / totalMinutes) * 100;

  // Generate hour labels with correct positioning - every 4 hours
  const hourLabels = Array.from({ length: 7 }).map((_, i) => {
    const hour = i * 4; // Every 4 hours (00, 04, 08, 12, 16, 20)
    const minutes = hour * 60;
    const position = (minutes / totalMinutes) * 100;

    return {
      hour,
      position,
      label: `${hour.toString().padStart(2, '0')}:00`,
    };
  });

  return (
    <div className="w-full px-4 opacity-30 transition-opacity duration-300 hover:opacity-100">
      <div className="relative">
        {/* Tick marks */}
        <div className="relative h-6">
          <Slider
            defaultValue={[720]}
            max={1439}
            step={5} // 5-minute increments
            className={cn('time-picker-slider relative z-20 h-1 w-full cursor-move', className)}
            onValueChange={handleValueChange}
            onPointerDown={() => setIsDragging(true)}
            onPointerUp={() => setIsDragging(false)}
            onPointerLeave={() => setIsDragging(false)}
            aria-label="Select time"
            {...props}
          />

          {/* Tooltip visible only when dragging */}
          {isDragging && (
            <div
              className="absolute top-2 z-30 select-none rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground shadow"
              style={{
                left: `${(time / 1439) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            >
              {formatTime(time)}
            </div>
          )}

          {/* Hour tick marks */}
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'absolute w-px -translate-x-1/2 transform bg-gray-100',
                i % 4 === 0 ? 'h-2' : 'h-1',
              )}
              style={{ left: `${(i / 24) * 100}%`, bottom: '16px' }}
            />
          ))}

          {/* Hour labels with 24-hour format */}
          {hourLabels.map((item, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 transform text-xs font-medium text-gray-400"
              style={{ left: `${item.position}%`, bottom: '0' }}
            >
              <span className="text-xs font-medium text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="relative">
          {/* Add style to make the slider's track transparent */}
          <style>{`
            .time-picker-slider > div:first-child {
              background: transparent !important;
            }
          `}</style>
        </div>
      </div>

      {/* Display selected time */}
      {/* <div className="mt-6 text-center">
        <span className="text-2xl font-medium">{formatTime(time)}</span>
        <p className="mt-1 text-sm text-muted-foreground">Selected Time</p>
      </div> */}
    </div>
  );
}
