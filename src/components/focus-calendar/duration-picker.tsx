import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { CornerDownLeft, Check } from 'lucide-react';

interface DurationOption {
  label: string;
  millis: number;
}

export const durations: DurationOption[] = [
  { label: '5 min', millis: 5 * 60_000 },
  { label: '10 min', millis: 10 * 60_000 },
  { label: '15 min', millis: 15 * 60_000 },
  { label: '20 min', millis: 20 * 60_000 },
  { label: '25 min', millis: 25 * 60_000 },
  { label: '30 min', millis: 30 * 60_000 },
  { label: '35 min', millis: 35 * 60_000 },
  { label: '40 min', millis: 40 * 60_000 },
  { label: '45 min', millis: 45 * 60_000 },
  { label: '50 min', millis: 50 * 60_000 },
  { label: '55 min', millis: 55 * 60_000 },
  { label: '1 hr', millis: 60 * 60_000 },
  { label: '2 hrs', millis: 2 * 60 * 60_000 },
  { label: '3 hrs', millis: 3 * 60 * 60_000 },
  { label: '4 hrs', millis: 4 * 60 * 60_000 },
  { label: '5 hrs', millis: 5 * 60 * 60_000 },
  { label: '6 hrs', millis: 6 * 60 * 60_000 },
  { label: '7 hrs', millis: 7 * 60 * 60_000 },
  { label: '8 hrs', millis: 8 * 60 * 60_000 },
];

export type { DurationOption };

interface DurationPickerProps {
  value?: DurationOption;
  onValueChange?: (value: DurationOption) => void;
  className?: string;
}

// Helper function to convert milliseconds to duration label
const millisToDuration = (millis: number): string => {
  const minutes = millis / 60_000;
  if (minutes >= 60) {
    const hours = minutes / 60;
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} min`;
};

// Helper function to parse duration string to milliseconds
const parseDuration = (duration: string): number => {
  if (duration.includes('hr')) {
    const hours = parseFloat(duration);
    return hours * 60 * 60_000;
  }
  return parseInt(duration) * 60_000;
};

// Helper function to convert duration to time format
const durationToTime = (duration: string): string => {
  if (duration.includes(':')) return duration;
  const millis = parseDuration(duration);
  const minutes = millis / 60_000;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const TimeInput = ({
  value,
  onChange,
  onFocus,
  defaultValue,
  onClose,
}: {
  value?: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  defaultValue?: string;
  onClose: () => void;
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value) {
      if (!value.includes(':')) {
        const timeValue = durationToTime(value);
        setInputValue(timeValue);
      } else {
        setInputValue(value);
      }
    } else {
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    if (defaultValue && !isFocused) {
      const timeValue = durationToTime(defaultValue);
      setInputValue(timeValue);
      onChange(timeValue);
    }
  }, [defaultValue, onChange, isFocused]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (newValue.length >= 2) {
      const hours = parseInt(newValue.substring(0, 2));
      if (hours > 9) return;
    }

    setInputValue(newValue);

    if (!newValue || newValue === '') {
      onChange('');
      return;
    }

    if (newValue.endsWith(':')) {
      const hours = newValue.slice(0, -1);
      if (hours) {
        onChange(`${hours}:00`);
      }
      return;
    }

    onChange(newValue);
  };

  const handleSave = () => {
    let finalValue = '';
    if (!inputValue || inputValue === '') {
      finalValue = '--:--';
    } else if (!inputValue.includes(':')) {
      finalValue = `${inputValue}:00`;
    } else {
      finalValue = inputValue;
    }

    // Convert time format to duration format
    const [hours, minutes] = finalValue.split(':').map(Number);
    const totalMillis = (hours * 60 + minutes) * 60_000;
    const durationLabel = millisToDuration(totalMillis);

    onChange(durationLabel);
    setIsFocused(false);
    onClose();
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Input
        type="time"
        value={inputValue}
        onChange={handleTimeChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-clear-button]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-inner-spin-button]:hidden"
        placeholder="--:--"
      />
      {isFocused && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-full gap-1.5 text-[11px] font-normal text-muted-foreground hover:bg-muted hover:text-muted-foreground"
          onClick={handleSave}
        >
          <CornerDownLeft className="h-3 w-3" />
          Return to save
        </Button>
      )}
    </div>
  );
};

const TimePickerList = ({
  onSelect,
  value,
  onClose,
}: {
  onSelect: (duration: DurationOption) => void;
  value?: DurationOption;
  onClose: () => void;
}) => {
  const [isCustomTime, setIsCustomTime] = useState(false);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isCustomTime && selectedRef.current) {
      setTimeout(() => {
        selectedRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 100);
    }
  }, [isCustomTime]);

  const handleCustomTimeChange = (timeString: string) => {
    const millis = timeString.includes(':')
      ? (parseInt(timeString.split(':')[0]) * 60 + parseInt(timeString.split(':')[1])) * 60_000
      : parseDuration(timeString);

    onSelect({ label: timeString, millis });
  };

  const handleFocus = () => {
    setIsCustomTime(true);
  };

  const handleDurationSelect = (duration: DurationOption) => {
    onSelect(duration);
    onClose();
  };

  const isDurationSelected = (duration: DurationOption) => {
    if (!value) return false;
    return value.millis === duration.millis;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="border-b p-2">
        <TimeInput
          value={value?.label || ''}
          onChange={handleCustomTimeChange}
          onFocus={handleFocus}
          defaultValue={value?.label || ''}
          onClose={onClose}
        />
      </div>
      {!isCustomTime && (
        <ScrollArea className="h-[200px]">
          <div className="p-1">
            {durations.map((duration) => {
              const isSelected = isDurationSelected(duration);
              return (
                <Button
                  key={duration.label}
                  ref={isSelected ? selectedRef : null}
                  variant="ghost"
                  className={cn(
                    'relative w-full justify-start rounded-sm px-2 py-1.5 text-sm font-normal hover:bg-muted',
                    isSelected && 'bg-accent',
                  )}
                  onClick={() => handleDurationSelect(duration)}
                >
                  {duration.label}
                  {isSelected && <Check className="absolute right-2 h-4 w-4 text-primary" />}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export function DurationPicker({ value, onValueChange, className }: DurationPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (duration: DurationOption) => {
    onValueChange?.(duration);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-[120px]', className)}
          aria-label="Select duration"
        >
          {value?.label || 'Duration'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px] bg-popover p-0" sideOffset={4}>
        <TimePickerList onSelect={handleSelect} value={value} onClose={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
