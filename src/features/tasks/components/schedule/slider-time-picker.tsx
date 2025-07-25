import { taskFormStore, updateField } from '@/features/tasks/stores/task-form.store';
import { updateTaskStartDateTime } from '@/features/tasks/stores/tasks.store';
import { cn } from '@/lib/utils';
import { Slider } from '@/shared/components/ui/slider';
import { useStore } from '@tanstack/react-store';
import type React from 'react';
import { useEffect, useState } from 'react';

type SliderProps = React.ComponentProps<typeof Slider>;

// Helper to convert HH:MM string to minutes
const parseTimeToMinutes = (timeString: string): number | null => {
  if (!timeString || !/^[0-2][0-9]:[0-5][0-9]$/.test(timeString)) {
    return null; // Return null for invalid format
  }
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

export function SliderTimePicker({ className, ...props }: SliderProps) {
  // Read startTime and other necessary values from the store
  const startTimeFromStore = useStore(taskFormStore, (state) => state.startTime);
  const startDate = useStore(taskFormStore, (state) => state.startDate);
  const taskId = useStore(taskFormStore, (state) => state.taskId);

  // Local state for slider value in minutes
  const [time, setTime] = useState<number>(() => {
    // Initialize based on store value or default
    const initialMinutes = parseTimeToMinutes(startTimeFromStore || '');
    return initialMinutes !== null ? initialMinutes : 720; // Default 12:00
  });
  const [isDragging, setIsDragging] = useState(false);

  // Effect to sync slider with store changes
  useEffect(() => {
    const storeMinutes = parseTimeToMinutes(startTimeFromStore || '');
    if (storeMinutes !== null && storeMinutes !== time) {
      setTime(storeMinutes);
    }
    // If store time becomes invalid/null, reset to default? Or keep last valid? Let's keep last valid for now.
    // else if (storeMinutes === null && time !== 720) {
    //   setTime(720); // Reset to default if store value is cleared/invalid
    // }
  }, [startTimeFromStore]); // Rerun effect if store value changes

  // Convert minutes to HH:MM format
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Handle slider value change - update local state AND store
  const handleValueChange = (value: number[]) => {
    const newMinutes = value[0];
    setTime(newMinutes);
    const formattedTime = formatTime(newMinutes);
    // Update the form store
    updateField('startTime', formattedTime);
  };

  // Handle slider release - sync with central store
  const handleSliderRelease = () => {
    setIsDragging(false);

    // Only update the central store if we have a taskId (editing mode)
    if (taskId) {
      const formattedTime = formatTime(time);
      // Update the central task store with the new time
      updateTaskStartDateTime(taskId, startDate, formattedTime);
    }
  };

  // Calculate working hours positions (9:00 - 17:00)
  const workStartMinutes = 9 * 60; // 9:00 = 540 minutes
  const workEndMinutes = 17 * 60; // 17:00 = 1020 minutes
  const totalMinutes = 24 * 60 - 1; // 1439 minutes (max slider value)

  // Calculate percentages for positioning
  const workStartPercent = (workStartMinutes / totalMinutes) * 100;
  const workDurationPercent = ((workEndMinutes - workStartMinutes) / totalMinutes) * 100;

  // Generate hour labels with correct positioning - every 4 hours
  const hourLabelsData = Array.from({ length: 6 }).map((_, i) => {
    // Changed length to 6 (0, 4, 8, 12, 16, 20)
    const hour = i * 4;
    const minutes = hour * 60;
    const position = (minutes / totalMinutes) * 100;

    return {
      hour,
      position,
      label: `${hour.toString().padStart(2, '0')}:00`,
    };
  });

  // Add the final 23:59 label
  hourLabelsData.push({
    hour: 23,
    position: 100,
    label: '23:59',
  });

  return (
    <div className="w-full px-4 opacity-50 transition-opacity duration-300 hover:opacity-100">
      <div className="relative">
        {/* Tick marks */}
        <div className="relative h-6">
          <Slider
            defaultValue={[720]}
            value={[time]}
            max={1439}
            step={5} // 5-minute increments
            className={cn(
              'time-picker-slider relative z-20 h-1 w-full cursor-col-resize',
              className,
            )}
            onValueChange={handleValueChange}
            onPointerDown={() => setIsDragging(true)}
            onPointerUp={handleSliderRelease}
            onPointerLeave={() => {
              if (isDragging) {
                handleSliderRelease();
              }
            }}
            timeValue={formatTime(time)}
            isDragging={isDragging}
            aria-label="Select time"
            {...props}
          />

          {/* Hour tick marks */}
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={`hour-${i}`}
              className={cn(
                'absolute w-px -translate-x-1/2 transform',
                i % 4 === 0 ? 'h-3 bg-gray-100' : 'h-2 bg-gray-200/80',
              )}
              style={{ left: `${((i * 60) / totalMinutes) * 100}%`, bottom: '16px' }}
            />
          ))}

          {/* Minute tick marks - every 15 minutes */}
          {Array.from({ length: 24 * 4 }).map((_, i) => {
            // Skip marks that already have hour marks (every 60 minutes)
            if (i % 4 === 0) return null;

            return (
              <div
                key={`minute-${i}`}
                className="absolute h-1 w-px -translate-x-1/2 transform bg-gray-300/60"
                style={{ left: `${((i * 15) / totalMinutes) * 100}%`, bottom: '16px' }}
              />
            );
          })}

          {/* Hour labels with 24-hour format */}
          {hourLabelsData.map((item, i) => (
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
    </div>
  );
}
