import { taskFormStore } from '@/features/tasks/stores/task-form.store';
import { updateTaskDuration } from '@/features/tasks/stores/tasks.store';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useStore } from '@tanstack/react-store';
import { Clock, LoaderCircle, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface DurationPickerProps {
  value: number; // milliseconds
  onChange: (duration: number) => void;
  className?: string;
  isEstimating?: boolean;
  onRequestAiEstimate?: () => void;
  taskTitle?: string;
}

const PRESET_DURATIONS = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '20 min', value: 20 },
  { label: '25 min', value: 25 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hr', value: 60 },
  { label: '1.5 hr', value: 90 },
  { label: '2 hr', value: 120 },
  { label: '2.5 hr', value: 150 },
  { label: '3 hr', value: 180 },
  { label: '4 hr', value: 240 },
  { label: '5 hr', value: 300 },
  { label: '6 hr', value: 360 },
  { label: '7 hr', value: 420 },
  { label: '8 hr', value: 480 },
];

export function DurationPicker({
  value,
  onChange,
  className,
  isEstimating = false,
  onRequestAiEstimate,
  taskTitle,
}: DurationPickerProps) {
  // Get task ID from store to update central store
  const taskId = useStore(taskFormStore, (state) => state.taskId);

  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [customHours, setCustomHours] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [customDurationSet, setCustomDurationSet] = useState(false);
  const selectTriggerRef = useRef<HTMLButtonElement>(null);
  const prevValueRef = useRef<number>(value);

  // Store initial value to prevent unwanted changes
  const initialValueRef = useRef<number>(value);

  // Update custom hours and minutes when dropdown opens
  useEffect(() => {
    if (isSelectOpen) {
      const totalMinutes = Math.round(value / (60 * 1000));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      setCustomHours(hours > 0 ? hours.toString() : '');
      setCustomMinutes(minutes > 0 ? minutes.toString() : '');
    }
  }, [isSelectOpen, value]);

  // Update selectedDuration when value prop changes externally
  useEffect(() => {
    // Skip if value hasn't changed or is very close to previous value (within 1 minute)
    if (value === prevValueRef.current || Math.abs(value - prevValueRef.current) < 60 * 1000) {
      return;
    }

    // Only update if value changed significantly from both previous and initial
    const minutes = Math.round(value / (60 * 1000));

    console.log('Duration value changed:', {
      from: prevValueRef.current / (60 * 1000),
      to: value / (60 * 1000),
      initialValue: initialValueRef.current / (60 * 1000),
    });

    // Check if the new duration matches any of our preset values
    const matchingPreset = PRESET_DURATIONS.find((preset) => preset.value === minutes);
    if (matchingPreset) {
      setSelectedDuration(matchingPreset.value.toString());
    } else {
      // If it doesn't match preset, mark as custom
      setSelectedDuration(`custom:${minutes}`);
      setCustomDurationSet(true);
    }
    prevValueRef.current = value;
  }, [value, customDurationSet]);

  const formatDurationDisplay = (minutes: number): string => {
    if (isNaN(minutes) || minutes < 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return mins === 0 ? `${hours} hr` : `${hours}.${mins} hr`;
  };

  // Update both form and central store
  const updateDuration = (durationMs: number) => {
    // Update form via parent component's onChange
    onChange(durationMs);

    // If we have a taskId, update the central store too
    if (taskId) {
      updateTaskDuration(taskId, durationMs);
    }
  };

  const handleDurationSelectChange = (value: string) => {
    const minutes = parseInt(value, 10);
    if (!isNaN(minutes)) {
      const durationMs = minutes * 60 * 1000;
      updateDuration(durationMs);
      setSelectedDuration(value);
      setCustomDurationSet(false);
      prevValueRef.current = durationMs;
    }
  };

  const handleCustomDurationSubmit = () => {
    const hours = parseInt(customHours, 10) || 0;
    const minutes = parseInt(customMinutes, 10) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes > 0) {
      const durationMs = totalMinutes * 60 * 1000;
      updateDuration(durationMs);
      setSelectedDuration(`custom:${totalMinutes}`);
      setCustomDurationSet(true);
      setIsSelectOpen(false);
      prevValueRef.current = durationMs;

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  };

  const handleCustomHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) >= 0)) {
      setCustomHours(value);
    }
  };

  const handleCustomMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (
      value === '' ||
      (/^\d+$/.test(value) && parseInt(value, 10) >= 0 && parseInt(value, 10) < 60)
    ) {
      setCustomMinutes(value);
    }
  };

  const durationMinutes = Math.round(value / (60 * 1000));

  const handleAiEstimateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRequestAiEstimate) {
      onRequestAiEstimate();
    }
  };

  return (
    <div className="relative">
      {isEstimating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/80 backdrop-blur-[1px]">
          <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}

      <Select
        value={selectedDuration || durationMinutes.toString()}
        onValueChange={handleDurationSelectChange}
        open={isSelectOpen}
        onOpenChange={setIsSelectOpen}
      >
        <SelectTrigger ref={selectTriggerRef} className={cn('h-8', className)}>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Duration">
              {customDurationSet && selectedDuration.includes(':')
                ? formatDurationDisplay(parseInt(selectedDuration.split(':')[1], 10))
                : formatDurationDisplay(durationMinutes)}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[320px] w-48">
          {onRequestAiEstimate && (
            <div className="border-b border-border p-2">
              <Button
                variant="outline"
                size="sm"
                className="flex w-full items-center justify-center gap-1.5 text-xs"
                onClick={handleAiEstimateClick}
                disabled={isEstimating || !taskTitle || taskTitle.length < 5}
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                AI estimate
              </Button>
            </div>
          )}

          <div className="border-b border-border p-2">
            <div className="mb-1 text-xs text-muted-foreground">Custom duration:</div>
            <div className="flex items-center gap-1">
              <Input
                className="h-8 w-12 text-center text-xs"
                placeholder="0h"
                value={customHours}
                onChange={handleCustomHoursChange}
                type="text"
                inputMode="numeric"
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleCustomDurationSubmit();
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-sm">:</span>
              <Input
                className="h-8 w-12 text-center text-xs"
                placeholder="0m"
                value={customMinutes}
                onChange={handleCustomMinutesChange}
                type="text"
                inputMode="numeric"
                min="0"
                max="59"
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleCustomDurationSubmit();
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <Button size="sm" className="ml-2 h-8 px-2" onClick={handleCustomDurationSubmit}>
                Set
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[200px]">
            <SelectGroup>
              {PRESET_DURATIONS.map((duration) => (
                <SelectItem key={duration.value} value={duration.value.toString()}>
                  {duration.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}
