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
import { Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface DurationPickerProps {
  value: number; // in milliseconds
  onChange: (durationMs: number) => void;
}

export function DurationPicker({ value, onChange }: DurationPickerProps) {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [customHours, setCustomHours] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [customDurationSet, setCustomDurationSet] = useState(false);
  const selectTriggerRef = useRef<HTMLButtonElement>(null);
  const prevValueRef = useRef<number>(value);

  // Update selectedDuration when value prop changes externally
  useEffect(() => {
    if (value !== prevValueRef.current && !customDurationSet) {
      const minutes = Math.round(value / (60 * 1000));
      // Check if the new duration matches any of our preset values
      const presetDurations = Array.from({ length: 32 }, (_, i) => (i + 1) * 15);
      if (presetDurations.includes(minutes)) {
        setSelectedDuration(minutes.toString());
      } else {
        // If it doesn't match preset, mark as custom
        setSelectedDuration(`custom:${minutes}`);
        setCustomDurationSet(true);
      }
      prevValueRef.current = value;
    }
  }, [value, customDurationSet]);

  const formatDurationDisplay = (minutes: number): string => {
    if (isNaN(minutes) || minutes < 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours ? `${hours}h${mins ? ` ${mins}m` : ''}` : `${mins}m`;
  };

  const handleDurationSelectChange = (value: string) => {
    const minutes = parseInt(value, 10);
    if (!isNaN(minutes)) {
      onChange(minutes * 60 * 1000);
      setSelectedDuration(value);
      setCustomDurationSet(false);
      prevValueRef.current = minutes * 60 * 1000;
    }
  };

  const handleCustomDurationSubmit = () => {
    const hours = parseInt(customHours, 10) || 0;
    const minutes = parseInt(customMinutes, 10) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes > 0) {
      const durationMs = totalMinutes * 60 * 1000;
      onChange(durationMs);
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

  return (
    <Select
      value={selectedDuration || durationMinutes.toString()}
      onValueChange={handleDurationSelectChange}
      open={isSelectOpen}
      onOpenChange={setIsSelectOpen}
    >
      <SelectTrigger ref={selectTriggerRef} className="h-8 min-w-[120px]">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <SelectValue placeholder="Duration">
            {customDurationSet && selectedDuration.includes(':')
              ? formatDurationDisplay(parseInt(selectedDuration.split(':')[1], 10))
              : formatDurationDisplay(durationMinutes)}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
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

        <ScrollArea className="h-[220px]">
          <SelectGroup>
            {Array.from({ length: 32 }, (_, i) => (i + 1) * 15).map((minutes) => (
              <SelectItem key={minutes} value={minutes.toString()}>
                {formatDurationDisplay(minutes)}
              </SelectItem>
            ))}
          </SelectGroup>
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}
